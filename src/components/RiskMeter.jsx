export default function RiskMeter({ value, showLabel = true, className = "" }) {
  const parsedValue = value === null || value === undefined || value === "" ? NaN : Number(value);
  if (!Number.isFinite(parsedValue)) {
    return showLabel ? (
      <span className={`font-mono text-[11px] text-muted-foreground ${className}`}>Not scored</span>
    ) : null;
  }

  const v = Math.max(0, Math.min(100, parsedValue));
  const tone = v >= 70 ? "bg-fake" : v >= 35 ? "bg-warn" : "bg-real";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        role="progressbar"
        aria-label="Fake risk score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        className="relative h-1 w-16 overflow-hidden rounded-full bg-white/[0.07]"
      >
        <div
          className={`h-full rounded-full ${tone} transition-all duration-700`}
          style={{ width: `${Math.max(4, v)}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {Math.round(v)}%
        </span>
      )}
    </div>
  );
}