interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export function MetricCard({ label, value, unit, highlight }: MetricCardProps) {
  return (
    <div className={`rounded-xl border bg-card p-5 transition-all ${highlight ? "glow-primary border-primary/30" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-3xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
