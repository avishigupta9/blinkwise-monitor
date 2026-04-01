import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

// Eye landmark indices for MediaPipe Face Mesh (468 landmarks)
// Left eye vertical: top(159), bottom(145)  horizontal: inner(133), outer(33)
// Right eye vertical: top(386), bottom(374) horizontal: inner(362), outer(263)
const LEFT_EYE = { top: [159, 158, 160], bottom: [145, 153, 144], inner: 133, outer: 33 };
const RIGHT_EYE = { top: [386, 385, 387], bottom: [374, 380, 373], inner: 362, outer: 263 };

const EAR_THRESHOLD = 0.21;
const BLINK_CONSEC_FRAMES = 2;

export interface BlinkFrame {
  timestamp: number;
  ear: number;
  blinkDetected: boolean;
  rollingBlinkRate: number;
}

export interface BlinkState {
  blinkCount: number;
  framesBelowThreshold: number;
  blinkTimestamps: number[];
  frames: BlinkFrame[];
  lowBlinkStart: number | null;
}

export function createBlinkState(): BlinkState {
  return {
    blinkCount: 0,
    framesBelowThreshold: 0,
    blinkTimestamps: [],
    frames: [],
    lowBlinkStart: null,
  };
}

function euclideanDist(
  landmarks: { x: number; y: number }[],
  i: number,
  j: number
): number {
  const a = landmarks[i];
  const b = landmarks[j];
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function calculateEyeAR(
  landmarks: { x: number; y: number }[],
  eye: typeof LEFT_EYE
): number {
  // Average vertical distances
  let vertSum = 0;
  for (let i = 0; i < eye.top.length; i++) {
    vertSum += euclideanDist(landmarks, eye.top[i], eye.bottom[i]);
  }
  const vertAvg = vertSum / eye.top.length;
  const horiz = euclideanDist(landmarks, eye.inner, eye.outer);
  return vertAvg / (horiz + 1e-6);
}

export function calculateEAR(landmarks: { x: number; y: number }[]): number {
  const leftEAR = calculateEyeAR(landmarks, LEFT_EYE);
  const rightEAR = calculateEyeAR(landmarks, RIGHT_EYE);
  return (leftEAR + rightEAR) / 2;
}

export function processFrame(
  ear: number,
  state: BlinkState,
  now: number
): { blinkDetected: boolean; rollingRate: number } {
  let blinkDetected = false;

  if (ear < EAR_THRESHOLD) {
    state.framesBelowThreshold++;
  } else {
    if (state.framesBelowThreshold >= BLINK_CONSEC_FRAMES) {
      state.blinkCount++;
      state.blinkTimestamps.push(now);
      blinkDetected = true;
    }
    state.framesBelowThreshold = 0;
  }

  // Rolling rate: blinks in last 60 seconds
  const cutoff = now - 60000;
  state.blinkTimestamps = state.blinkTimestamps.filter((t) => t > cutoff);
  const elapsed = Math.min(60, (now - (state.blinkTimestamps[0] || now)) / 1000);
  const rollingRate = elapsed > 5 ? (state.blinkTimestamps.length / elapsed) * 60 : 0;

  const frame: BlinkFrame = {
    timestamp: now,
    ear,
    blinkDetected,
    rollingBlinkRate: rollingRate,
  };
  state.frames.push(frame);

  return { blinkDetected, rollingRate };
}

export type BlinkStatus = "normal" | "low" | "very-low" | "high" | "fatigue";

export interface RuleResult {
  status: BlinkStatus;
  message: string;
  priority: number;
}

export function evaluateRules(
  rollingRate: number,
  state: BlinkState,
  now: number
): RuleResult | null {
  // Very low blink rate
  if (rollingRate > 0 && rollingRate < 5) {
    state.lowBlinkStart = state.lowBlinkStart ?? now;
    return {
      status: "very-low",
      message:
        "Very low blink rate detected. This significantly increases risk of ocular dryness and discomfort during prolonged screen exposure.",
      priority: 1,
    };
  }

  // Track sustained low blink
  if (rollingRate > 0 && rollingRate < 8) {
    if (!state.lowBlinkStart) state.lowBlinkStart = now;
    const duration = (now - state.lowBlinkStart) / 1000 / 60;

    if (duration >= 5) {
      return {
        status: "fatigue",
        message:
          "Sustained reduced blinking detected. Long periods of low blink rate are strongly associated with digital eye strain and tear film instability.",
        priority: 2,
      };
    }

    return {
      status: "low",
      message:
        "Low blink rate detected. Reduced blinking during screen use is associated with tear film instability and increased risk of dry eye symptoms.",
      priority: 3,
    };
  }

  // High blink rate
  if (rollingRate > 25) {
    state.lowBlinkStart = null;
    return {
      status: "high",
      message:
        "Frequent blinking detected. This may indicate ocular irritation, dryness, or visual fatigue.",
      priority: 4,
    };
  }

  state.lowBlinkStart = null;
  return null;
}

export interface SessionSummary {
  duration: number; // seconds
  totalBlinks: number;
  avgRate: number;
  minRate: number;
  maxRate: number;
  percentBelowHealthy: number;
  interpretation: string;
}

export function generateSummary(state: BlinkState, startTime: number, endTime: number, pausedMs = 0): SessionSummary {
  const observedMs = Math.max(1000, endTime - startTime - pausedMs);
  const duration = observedMs / 1000;
  const totalBlinks = state.blinkCount;
  const observedMin = duration / 60;
  const avgRate = observedMin > 0 ? totalBlinks / observedMin : 0;

  const rates = state.frames
    .filter((f) => f.rollingBlinkRate > 0)
    .map((f) => f.rollingBlinkRate);

  const minRate = rates.length > 0 ? Math.min(...rates) : 0;
  const maxRate = rates.length > 0 ? Math.max(...rates) : 0;

  const belowHealthy = rates.filter((r) => r < 8).length;
  const percentBelowHealthy = rates.length > 0 ? (belowHealthy / rates.length) * 100 : 0;

  let interpretation: string;
  if (avgRate < 8) {
    interpretation = `Low blink rate during observed screen time (${avgRate.toFixed(1)} blinks/min average). Research commonly reports spontaneous blink rate drops during digital tasks, with normal resting rates typically between 12–15 blinks/min. Reduced blinking is associated with tear film instability and dry eye symptoms. Consider regular blink reminders and short breaks. This is behavioral feedback, not a diagnosis.`;
  } else if (avgRate > 25) {
    interpretation = `Elevated blink rate during observed screen time (${avgRate.toFixed(1)} blinks/min average). This can occur with ocular discomfort, fatigue, or concentration shifts. Review your comfort, lighting, and break frequency. This is behavioral feedback, not a diagnosis.`;
  } else {
    interpretation = `Your blink rate stayed within a commonly cited resting range for adults (${avgRate.toFixed(1)} blinks/min average). During screen use, rates often decrease, so maintaining this range is generally favorable. Continue practicing good blinking habits. This is behavioral feedback, not a diagnosis.`;
  }

  return { duration, totalBlinks, avgRate, minRate, maxRate, percentBelowHealthy, interpretation };
}

let faceLandmarker: FaceLandmarker | null = null;

export async function initFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) return faceLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFacialTransformationMatrixes: false,
    outputFaceBlendshapes: false,
  });

  return faceLandmarker;
}

export function detectLandmarks(
  video: HTMLVideoElement,
  timestamp: number
): FaceLandmarkerResult | null {
  if (!faceLandmarker) return null;
  try {
    return faceLandmarker.detectForVideo(video, timestamp);
  } catch {
    return null;
  }
}
