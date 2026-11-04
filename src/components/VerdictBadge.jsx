import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from "lucide-react";

const CONFIG = {
  real: {
    label: "Looks consistent",
    Icon: ShieldCheck,
    className: "text-real border-real/25 bg-real/10",
  },
  suspicious: {
    label: "Needs a look",
    Icon: ShieldAlert,
    className: "text-warn border-warn/25 bg-warn/10",
  },
  fake: {
    label: "Fake",
    Icon: ShieldX,
    className: "text-fake border-fake/30 bg-fake/10",
  },
  inconclusive: {
    label: "Unclear",
    Icon: HelpCircle,
    className: "text-muted-foreground border-border bg-white/[0.03]",
  },
};

export default function VerdictBadge({ verdict = "inconclusive", className = "" }) {
  const config = CONFIG[verdict] || CONFIG.inconclusive;
  const { Icon, label, className: tone } = config;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${tone} ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}