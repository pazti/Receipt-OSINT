import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VerdictBadge from "@/components/VerdictBadge";
import RiskMeter from "@/components/RiskMeter";
import { formatNaira, formatWhen } from "@/lib/format";
import LoadError from "@/components/LoadError";

function Field({ label, value, mono = true }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-[13px] text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

function Signal({ label, state, note }) {
  const tone =
    state === "confirmed"
      ? "bg-real/15 text-real"
      : state === "flagged"
        ? "bg-warn/15 text-warn"
        : "bg-white/[0.06] text-muted-foreground";

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${tone}`}>
        {state === "confirmed" ? (
          <Check className="h-2.5 w-2.5" />
        ) : state === "flagged" ? (
          <X className="h-2.5 w-2.5" />
        ) : (
          <span className="h-1 w-1 rounded-full bg-current" />
        )}
      </span>
      <div>
        <p className="text-[12px] font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

export default function CheckDetail() {
  const { id } = useParams();
  const [check, setCheck] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setImageError(null);
      setImageUrl("");
      setCheck(null);
      try {
        const record = await base44.entities.ReceiptCheck.get(id).catch((loadError) => {
          if (loadError?.status === 404) return null;
          throw loadError;
        });
        if (!active) return;
        setCheck(record);
        if (record?.file_uri) {
          try {
            const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
              file_uri: record.file_uri,
              expires_in: 3600,
            });
            if (active) setImageUrl(signed_url);
          } catch (loadError) {
            if (active) setImageError(loadError);
          }
        }
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
  }, [id, reloadKey]);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl border border-white/[0.07] bg-card/60" />;
  }

  if (!check) {
    if (error) {
      return (
        <div className="space-y-4">
          <Link to="/checks" className="inline-flex text-[13px] text-muted-foreground hover:text-foreground">
            Back to the check log
          </Link>
          <LoadError error={error} onRetry={() => setReloadKey((key) => key + 1)} />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-card/60 p-10 text-center">
        <p className="text-sm text-foreground">That check is not here</p>
        <Link to="/checks" className="mt-3 inline-block text-[13px] text-primary">
          Back to the check log
        </Link>
      </div>
    );
  }

  const hotspots = Array.isArray(check.ela_hotspots) ? check.ela_hotspots : [];

  return (
    <div className="animate-rise space-y-6">
      <Link
        to="/checks"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Check log
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <VerdictBadge verdict={check.verdict} />
            <RiskMeter value={check.risk_score} />
          </div>
          <h1 className="mt-3 font-heading text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {check.amount ? formatNaira(check.amount) : "Amount not read"}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {check.sender_name || "Unknown sender"} · {check.from_bank || "—"} to {check.to_bank || "—"} ·{" "}
            {formatWhen(check.created_date)}
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {check.processing_ms ? `${(check.processing_ms / 1000).toFixed(1)}s read` : "—"}
        </p>
      </header>

      <p className="rounded-lg border border-warn/25 bg-warn/5 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        Image analysis can flag possible edits, but it cannot prove that money reached the recipient. Confirm
        the credit in your bank or payment-provider account before releasing goods.
      </p>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-black/40">
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Receipt submitted to the bot" className="w-full" />
                {hotspots.map((spot, index) => (
                  <span
                    key={index}
                    className="absolute rounded-sm border border-fake/70 bg-fake/20"
                    style={{
                      left: `${spot.x * 100}%`,
                      top: `${spot.y * 100}%`,
                      width: `${spot.w * 100}%`,
                      height: `${spot.h * 100}%`,
                    }}
                  />
                ))}
              </div>
            ) : imageError ? (
              <div className="flex h-64 items-center justify-center px-6 text-center text-[12px] text-muted-foreground">
                Could not load the receipt image: {imageError.message || "Please try again later."}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-[12px] text-muted-foreground">
                {check.file_uri ? "Preparing image…" : "No image stored for this check"}
              </div>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Red boxes mark where error-level analysis found pixels that disagree with their recompressed
            surroundings. Receipt images are stored privately.
          </p>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-white/[0.07] bg-card/60 p-5">
            <h2 className="font-heading text-sm font-medium text-foreground">Why this score</h2>
            <ul className="mt-3 space-y-2">
              {(check.reasons || []).map((reason, index) => (
                <li key={index} className="flex gap-2.5 text-[12px] leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                  {reason}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Signal
              label="Reference format"
              state={
                check.reference_valid === true
                  ? "confirmed"
                  : check.reference_valid === false
                    ? "flagged"
                    : "unknown"
              }
              note={
                check.reference_note ||
                (check.reference
                  ? check.reference_valid === null || check.reference_valid === undefined
                    ? "Format not checked"
                    : check.reference
                  : "No reference found")
              }
            />
            <Signal
              label="Bank transaction verification"
              state={check.bank_verified === "confirmed" ? "confirmed" : "unknown"}
              note={
                check.bank_verify_note ||
                (check.bank_verified === "confirmed"
                  ? "Confirmed by provider"
                  : "Not confirmed by a bank or payment provider")
              }
            />
          </section>

          <section className="rounded-xl border border-white/[0.07] bg-card/60 p-5">
            <h2 className="font-heading text-sm font-medium text-foreground">Extracted details</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Reference" value={check.reference} />
              <Field label="Transaction time" value={check.transaction_at} />
              <Field label="Sender account" value={check.sender_account} />
              <Field label="Recipient account" value={check.recipient_account} />
              <Field label="Name on receipt" value={check.beneficiary} />
              <Field label="ELA score" value={check.ela_score ? `${check.ela_score}/100` : "—"} />
            </div>
          </section>

          {check.ocr_text && (
            <details className="rounded-xl border border-white/[0.07] bg-card/60 p-5">
              <summary className="cursor-pointer font-heading text-sm font-medium text-foreground">
                Full text read from the image
              </summary>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                {check.ocr_text}
              </pre>
            </details>
          )}

          {check.error_message && (
            <section className="rounded-xl border border-fake/30 bg-fake/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-fake">Read failed</p>
              <p className="mt-1 text-[12px] text-foreground">{check.error_message}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}