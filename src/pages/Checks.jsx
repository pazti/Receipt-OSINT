import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CheckList from "@/components/CheckList";
import LoadError from "@/components/LoadError";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "real", label: "Looks consistent" },
  { key: "suspicious", label: "Needs a look" },
  { key: "fake", label: "Fake" },
];

export default function Checks() {
  const [filter, setFilter] = useState("all");
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const page = await base44.entities.ReceiptCheck.filter(
          filter === "all" ? {} : { verdict: filter },
          { sort: "-created_date", limit: 50 }
        );
        if (active) setChecks(page.items);
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
  }, [filter, reloadKey]);

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Check log</p>
        <h1 className="mt-3 font-heading text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Every receipt your bot has read
        </h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              filter === item.key
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/[0.08] text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-white/[0.07] bg-card/60" />
      ) : error ? (
        <LoadError error={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <CheckList
          checks={checks}
          title={filter === "all" ? "All checks" : FILTERS.find((f) => f.key === filter).label}
          emptyHint={
            filter === "all"
              ? "Nothing here yet. Forward a transfer screenshot to your Telegram bot."
              : "No receipts in this category yet."
          }
        />
      )}
    </div>
  );
}