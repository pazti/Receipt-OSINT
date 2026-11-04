import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plug } from "lucide-react";
import { getReceiptDashboard } from "@/api/receiptChecks";
import StatCard from "@/components/StatCard";
import CheckList from "@/components/CheckList";
import PipelineSteps from "@/components/PipelineSteps";
import LoadError from "@/components/LoadError";
import { formatCompactNaira } from "@/lib/format";

export default function Home() {
  const [checks, setChecks] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await getReceiptDashboard();
        if (!active) return;

        setStats([
          { label: "Checks today", value: String(dashboard.today), sub: "forwarded to the bot" },
          {
            label: "Flagged fake",
            value: String(dashboard.fake),
            sub: dashboard.today ? `${Math.round((dashboard.fake / dashboard.today) * 100)}% of checks` : "none yet",
          },
          { label: "Value reviewed", value: formatCompactNaira(dashboard.valueReviewed), sub: "today" },
          {
            label: "Avg read",
            value: dashboard.averageReadMs ? `${(dashboard.averageReadMs / 1000).toFixed(1)}s` : "—",
            sub: "screenshot to verdict",
          },
        ]);
        setChecks(dashboard.recent);
      } catch (loadError) {
        if (active) setError(loadError);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <div className="animate-rise space-y-10">
      <header>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1 w-1 animate-pulse-dot rounded-full bg-primary" />
          Onitsha · receipt forensics
        </div>
        <h1 className="mt-4 max-w-2xl font-heading text-[2.1rem] font-medium leading-[1.06] tracking-tight text-foreground sm:text-[2.75rem]">
          Every receipt, read in four seconds.
        </h1>
        <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
          Forward a transfer screenshot to your Telegram bot. It pulls out the details, tests the image for
          editing, checks the transaction reference, and replies with a verdict and a fake-risk score.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plug className="h-4 w-4" />
            Connect the bot
          </Link>
          <Link
            to="/checks"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            See the check log
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-xl border border-white/[0.07] bg-card/60" />
            ))
          : error
            ? (
                <div className="col-span-2 lg:col-span-4">
                  <LoadError error={error} onRetry={() => setReloadKey((key) => key + 1)} />
                </div>
              )
            : stats
              ? stats.map((stat) => <StatCard key={stat.label} {...stat} />)
              : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        {!error && !loading && (
          <CheckList checks={checks || []} emptyHint="Nothing here yet. Forward a transfer screenshot to your Telegram bot." />
        )}
        <PipelineSteps />
      </section>
    </div>
  );
}