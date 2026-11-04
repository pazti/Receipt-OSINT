import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getErrorMessage } from "@/lib/errorMessage";

const STEPS = [
  {
    n: "01",
    title: "Create the bot",
    body: "In Telegram open @BotFather, send /newbot, choose a name and a username, then copy the token it returns.",
  },
  {
    n: "02",
    title: "Store the token",
    body: "Paste it into Dashboard → Secrets as TELEGRAM_BOT_TOKEN. It is already set for this app.",
  },
  {
    n: "03",
    title: "Connect",
    body: "Press the button below. This registers the app's webhook with Telegram so screenshots reach the checker.",
  },
];

export default function Setup() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verifier, setVerifier] = useState("");
  const [savedVerifier, setSavedVerifier] = useState(false);

  const load = async (action = "status") => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("telegramConnect", { action });
      if (res.data.error) setError(res.data.error);
      setStatus(res.data);
      setVerifier(res.data.verify_endpoint || "");
    } catch (err) {
      setError(getErrorMessage(err, "Could not connect to Telegram. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load("status");
  }, []);

  const saveVerifier = async () => {
    setBusy(true);
    setError("");
    setSavedVerifier(false);
    try {
      await base44.functions.invoke("telegramConnect", { action: "save-verifier", verify_endpoint: verifier });
      setSavedVerifier(true);
      setTimeout(() => setSavedVerifier(false), 2000);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the verification endpoint. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const connected = Boolean(status && status.connected);

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Bot setup</p>
        <h1 className="mt-3 font-heading text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Connect your Telegram bot
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Traders forward screenshots straight to the bot. Every check lands in this dashboard.
        </p>
      </header>

      <section className="rounded-2xl border border-white/[0.07] bg-card/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "animate-pulse-dot bg-real" : "bg-muted-foreground/50"
              }`}
            />
            <div>
              <p className="text-[13px] font-medium text-foreground">
                {connected ? `Connected as @${status.bot_username}` : "Not connected yet"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {connected ? "webhook live" : "waiting for setup"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected && status.bot_username && (
              <a
                href={`https://t.me/${status.bot_username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-white/[0.04]"
              >
                Open bot <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              onClick={() => load(connected ? "status" : "connect")}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {connected ? "Refresh status" : "Connect bot"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-fake/30 bg-fake/10 px-3 py-2 text-[12px] text-foreground">
            {error}
          </p>
        )}

        {connected && (
          <dl className="mt-5 grid gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Webhook</dt>
              <dd className="mt-1 truncate font-mono text-[11px] text-foreground">{status.webhook_url}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Queued</dt>
              <dd className="mt-1 font-mono text-[11px] text-foreground">{status.pending_updates} updates</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Last error</dt>
              <dd className="mt-1 truncate font-mono text-[11px] text-foreground">
                {status.last_error || "none"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="rounded-xl border border-white/[0.07] bg-card/60 p-4">
            <p className="font-mono text-[10px] tracking-[0.12em] text-primary/70">{step.n}</p>
            <p className="mt-2 text-[13px] font-medium text-foreground">{step.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-card/60 p-6">
        <h2 className="font-heading text-sm font-medium text-foreground">Bank confirmation (optional)</h2>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
          Nigerian banks do not publish a public endpoint for confirming a NIP reference. If you have a
          Moniepoint, PSP or bank partner endpoint, paste it here — the bot will call it with
          <span className="font-mono text-foreground"> {`{ref}`} </span> replaced by the reference, or as a{" "}
          <span className="font-mono text-foreground">?reference=</span> query. Without it, checks show the
          reference as formatted but not bank-confirmed.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={verifier}
            onChange={(event) => setVerifier(event.target.value)}
            placeholder="https://your-verifier.example.com/confirm?ref={ref}"
            className="flex-1 rounded-lg border border-white/[0.1] bg-background px-3 py-2 font-mono text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
          />
          <button
            onClick={saveVerifier}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] px-4 py-2 text-[12px] text-foreground transition-colors hover:bg-white/[0.04] disabled:opacity-50"
          >
            {savedVerifier ? <CheckCircle2 className="h-3.5 w-3.5 text-real" /> : null}
            {savedVerifier ? "Saved" : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
}