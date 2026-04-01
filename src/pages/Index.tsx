import { useRef, useState, useCallback, useEffect } from "react";
import { Eye, Play, Square, Timer, Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { NotificationPanel, type Notification } from "@/components/NotificationPanel";
import { SessionSummaryDialog } from "@/components/SessionSummaryDialog";
import {
  initFaceLandmarker,
  detectLandmarks,
  calculateEAR,
  processFrame,
  evaluateRules,
  generateSummary,
  createBlinkState,
  type BlinkState,
  type BlinkStatus,
  type SessionSummary,
} from "@/lib/blinkDetection";

export default function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const blinkStateRef = useRef<BlinkState>(createBlinkState());
  const startTimeRef = useRef<number>(0);
  const lastAlertRef = useRef<Record<string, number>>({});

  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkRate, setBlinkRate] = useState(0);
  const [ear, setEar] = useState(0);
  const [status, setStatus] = useState<BlinkStatus | "idle">("idle");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startSession = useCallback(async () => {
    setIsLoading(true);
    try {
      await startCamera();
      await initFaceLandmarker();
      blinkStateRef.current = createBlinkState();
      startTimeRef.current = Date.now();
      lastAlertRef.current = {};
      setBlinkCount(0);
      setBlinkRate(0);
      setEar(0);
      setElapsed(0);
      setStatus("idle");
      setNotifications([]);
      setSummary(null);
      setIsRunning(true);

      const loop = () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        const now = Date.now();
        const result = detectLandmarks(video, performance.now());

        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          const currentEAR = calculateEAR(landmarks);
          const { rollingRate } = processFrame(currentEAR, blinkStateRef.current, now);

          setEar(currentEAR);
          setBlinkCount(blinkStateRef.current.blinkCount);
          setBlinkRate(Math.round(rollingRate * 10) / 10);

          const rule = evaluateRules(rollingRate, blinkStateRef.current, now);
          if (rule) {
            setStatus(rule.status);
            // Cooldown: 60s per alert type
            const lastTime = lastAlertRef.current[rule.status] || 0;
            if (now - lastTime > 60000) {
              lastAlertRef.current[rule.status] = now;
              setNotifications((prev) => [
                { id: now, result: rule, time: new Date() },
                ...prev.slice(0, 19),
              ]);
            }
          } else {
            setStatus("normal");
          }
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      // Small delay for camera warmup
      setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(loop);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  }, [startCamera]);

  const stopSession = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setIsRunning(false);

    const s = generateSummary(blinkStateRef.current, startTimeRef.current, Date.now());
    setSummary(s);
    setShowSummary(true);

    stopCamera();
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold tracking-wide text-foreground">
                BLINK MONITOR
              </h1>
              <p className="text-xs text-muted-foreground">Real-Time Eye Strain Awareness</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-2xl font-bold text-foreground">
              <Timer className="h-5 w-5 text-muted-foreground" />
              {formatTime(elapsed)}
            </div>

            {!isRunning ? (
              <Button
                onClick={startSession}
                disabled={isLoading}
                className="gap-2 bg-primary font-mono text-sm font-semibold tracking-wider text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-4 w-4" />
                {isLoading ? "LOADING..." : "START"}
              </Button>
            ) : (
              <Button
                onClick={stopSession}
                variant="destructive"
                className="gap-2 font-mono text-sm font-semibold tracking-wider"
              >
                <Square className="h-4 w-4" />
                STOP
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video feed */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-video bg-muted/30">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="absolute inset-0 hidden" />

                {!cameraReady && !isRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/50">
                      {isLoading ? (
                        <Camera className="h-8 w-8 animate-pulse text-primary" />
                      ) : (
                        <CameraOff className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {isLoading ? "Initializing camera & model..." : "Press START to begin observation"}
                    </p>
                  </div>
                )}

                {isRunning && (
                  <div className="absolute left-4 top-4">
                    <div className="flex items-center gap-2 rounded-full border border-destructive/40 bg-card/80 px-3 py-1 backdrop-blur-sm">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                      <span className="font-mono text-xs font-semibold text-destructive">REC</span>
                    </div>
                  </div>
                )}

                {isRunning && (
                  <div className="scan-line absolute inset-0 pointer-events-none" />
                )}
              </div>

              {/* EAR bar */}
              <div className="flex items-center gap-3 border-t px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground">EAR</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-150"
                    style={{ width: `${Math.min(ear * 250, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-foreground">{ear.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <StatusIndicator status={status} />

            <MetricCard
              label="Blink Rate"
              value={blinkRate.toFixed(1)}
              unit="/min"
              highlight={isRunning}
            />
            <MetricCard label="Total Blinks" value={blinkCount} />

            {/* Notifications */}
            <div className="flex-1 rounded-xl border bg-card">
              <div className="border-b px-4 py-3">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Alerts
                </p>
              </div>
              <NotificationPanel notifications={notifications} />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs italic text-muted-foreground">
          This system provides behavioral insights based on established research and is not intended
          for medical diagnosis.
        </p>
      </main>

      <SessionSummaryDialog
        summary={summary}
        open={showSummary}
        onClose={() => setShowSummary(false)}
      />
    </div>
  );
}
