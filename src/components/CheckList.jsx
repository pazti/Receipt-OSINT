import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import VerdictBadge from "@/components/VerdictBadge";
import RiskMeter from "@/components/RiskMeter";
import { formatNaira, formatWhen, initials } from "@/lib/format";

export default function CheckList({ checks = [], title = "Latest receipts", sample = false, emptyHint }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-card/60">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-heading text-sm font-medium text-foreground">{title}</h2>
          {sample && (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              sample
            </span>
          )}
          {!sample && checks.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">{checks.length}</span>
          )}
        </div>
        {title === "Latest receipts" && (
          <Link
            to="/checks"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            All <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {checks.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[13px] text-foreground">No receipts checked yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
            {emptyHint || "Forward a transfer screenshot to your Telegram bot and the verdict will land here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {checks.map((check) => (
            <li key={check.id}>
              <Link
                to={sample ? "/checks" : `/checks/${check.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] font-mono text-[10px] text-muted-foreground">
                  {initials(check.sender_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-foreground">{check.sender_name || "Unknown sender"}</p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {check.from_bank || "—"} to {check.to_bank || "—"}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-[13px] tabular-nums text-foreground">
                    {check.amount ? formatNaira(check.amount) : "—"}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">{formatWhen(check.created_date)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <VerdictBadge verdict={check.verdict} />
                  <RiskMeter value={check.risk_score} className="hidden md:flex" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {sample && (
        <p className="border-t border-white/[0.06] px-5 py-3 text-[11px] text-muted-foreground">
          Placeholder results. Live verdicts appear here once your Telegram bot is connected.
        </p>
      )}
    </section>
  );
}