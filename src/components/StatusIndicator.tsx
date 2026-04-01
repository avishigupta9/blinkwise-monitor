import { type BlinkStatus } from "@/lib/blinkDetection";

const statusConfig: Record<BlinkStatus | "idle", { label: string; color: string; glow: string }> = {
  idle: { label: "STANDBY", color: "bg-muted-foreground/40", glow: "" },
  normal: { label: "NORMAL", color: "bg-[hsl(var(--success))]", glow: "glow-primary" },
  low: { label: "LOW BLINK", color: "bg-[hsl(var(--warning))]", glow: "glow-warning" },
  "very-low": { label: "CRITICAL", color: "bg-[hsl(var(--destructive))]", glow: "glow-destructive" },
  high: { label: "HIGH BLINK", color: "bg-[hsl(var(--warning))]", glow: "glow-warning" },
  fatigue: { label: "FATIGUE RISK", color: "bg-[hsl(var(--destructive))]", glow: "glow-destructive" },
};

export function StatusIndicator({ status }: { status: BlinkStatus | "idle" }) {
  const cfg = statusConfig[status];
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${cfg.glow}`}>
      <div className={`h-3 w-3 rounded-full ${cfg.color} ${status !== "idle" ? "pulse-ring" : ""}`} />
      <span className="font-mono text-sm font-semibold tracking-widest text-foreground">
        {cfg.label}
      </span>
    </div>
  );
}
