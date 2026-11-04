const STEPS = [
  {
    n: "01",
    title: "Read the image",
    body: "Bank, amount, date, account numbers and the NIP reference are pulled off the screenshot.",
  },
  {
    n: "02",
    title: "Test for edits",
    body: "Error level analysis re-saves the image and maps where pixels behave like a fresh edit.",
  },
  {
    n: "03",
    title: "Check the reference",
    body: "The transaction ID is tested against the format that bank issues for NIP transfers.",
  },
  {
    n: "04",
    title: "Reply with a verdict",
    body: "A fake-risk score plus the exact reasons behind it, back in the Telegram chat.",
  },
];

export default function PipelineSteps() {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-card/60 p-5">
      <h2 className="font-heading text-sm font-medium text-foreground">How a receipt is read</h2>
      <ol className="mt-5 space-y-4">
        {STEPS.map((step) => (
          <li key={step.n} className="flex gap-3.5">
            <span className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-primary/70">{step.n}</span>
            <div>
              <p className="text-[13px] font-medium text-foreground">{step.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-white/[0.06] pt-4 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-muted-foreground/70">
        Verdicts are evidence, not proof of payment. Always confirm in your own bank app before releasing goods.
      </p>
    </section>
  );
}