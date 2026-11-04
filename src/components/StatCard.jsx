export default function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-card/60 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-heading text-2xl font-medium tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}