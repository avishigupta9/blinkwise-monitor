import { AlertTriangle, Info } from "lucide-react";
import type { RuleResult } from "@/lib/blinkDetection";

export interface Notification {
  id: number;
  result: RuleResult;
  time: Date;
}

export function NotificationPanel({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-muted-foreground">
        <Info className="mr-2 h-4 w-4" />
        <span className="text-sm">No alerts yet</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 max-h-[280px] overflow-y-auto">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex gap-3 rounded-lg border p-3 text-sm ${
            n.result.priority <= 2
              ? "border-destructive/30 bg-destructive/5"
              : "border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5"
          }`}
        >
          <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${
            n.result.priority <= 2 ? "text-destructive" : "text-[hsl(var(--warning))]"
          }`} />
          <div>
            <p className="text-foreground/90">{n.result.message}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {n.time.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
