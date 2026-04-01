import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SessionSummary } from "@/lib/blinkDetection";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}m ${sec}s`;
}

export function SessionSummaryDialog({
  summary,
  open,
  onClose,
}: {
  summary: SessionSummary | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!summary) return null;

  const rows = [
    { label: "Duration", value: formatDuration(summary.duration) },
    { label: "Total Blinks", value: summary.totalBlinks.toString() },
    { label: "Average Rate", value: `${summary.avgRate.toFixed(1)} /min` },
    { label: "Minimum Rate", value: `${summary.minRate.toFixed(1)} /min` },
    { label: "Maximum Rate", value: `${summary.maxRate.toFixed(1)} /min` },
    { label: "Time Below Healthy Range", value: `${summary.percentBelowHealthy.toFixed(0)}%` },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl tracking-wide">Session Report</DialogTitle>
          <DialogDescription>Research-based behavioral insights</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.label}</p>
              <p className="mt-1 font-mono text-lg font-semibold text-foreground">{r.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm leading-relaxed text-foreground/90">{summary.interpretation}</p>
        </div>

        <p className="mt-2 text-xs italic text-muted-foreground">
          This system provides behavioral insights based on established research and is not intended
          for medical diagnosis.
        </p>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
