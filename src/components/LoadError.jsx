import { getErrorMessage } from "@/lib/errorMessage";

export default function LoadError({ error, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-fake/30 bg-fake/10 p-4"
    >
      <p className="text-[13px] font-medium text-foreground">Could not load this data</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        {getErrorMessage(error, "Something went wrong. Please try again.")}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-white/[0.12] px-3 py-1.5 text-[12px] text-foreground transition-colors hover:bg-white/[0.05]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
