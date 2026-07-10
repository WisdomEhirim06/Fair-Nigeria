// The hero's proof panel: a representative live-collation ledger. It shows the
// trust mechanism as an artifact — real sheets, their SHA-256 fingerprints, and
// the 2-of-3 verified/pending state — rather than a decorative map.

const ROWS = [
  { pu: 'PU 004 · Surulere, LAG', hash: 'a1f3…7c9', state: 'verified' as const },
  { pu: 'PU 118 · Ikeja, LAG', hash: '9d2e…41b', state: 'verified' as const },
  { pu: 'PU 077 · Kano Municipal, KAN', hash: '4b8a…e02', state: 'verified' as const },
  { pu: 'PU 231 · Aba North, ABI', hash: 'awaiting', state: 'pending' as const },
];

export function CollationLedger({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-ink/10 bg-white/90 shadow-[0_22px_60px_rgba(15,31,23,0.16)] backdrop-blur">
        <div className="flex items-center justify-between bg-ink px-5 py-3.5 text-cream">
          <span className="flex items-center gap-2.5 text-[0.82rem] font-bold tracking-[0.03em]">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime" />
            </span>
            Live collation
          </span>
          <span className="font-mono text-[0.6rem] tracking-[0.12em] text-lime-bright">
            2027 · PRESIDENTIAL
          </span>
        </div>

        <div className="flex items-end justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <div className="text-[2.6rem] font-extrabold leading-none tracking-[-0.03em]">
              418
              <span className="text-[1.35rem] font-bold text-muted"> / 774</span>
            </div>
            <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted">
              LGAs reporting
            </div>
          </div>
          <div className="text-right">
            <div className="text-[1.5rem] font-extrabold leading-none text-leaf">2 of 3</div>
            <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted">
              must agree
            </div>
          </div>
        </div>

        <div className="px-5">
          {ROWS.map((r) => (
            <div
              key={r.pu}
              className="flex items-center justify-between gap-3 border-b border-ink/[0.08] py-3 last:border-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[0.9rem] font-semibold">{r.pu}</div>
                <div className="mt-0.5 font-mono text-[0.64rem] tracking-[0.05em] text-muted">
                  sha256 {r.hash}
                </div>
              </div>
              {r.state === 'verified' ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lime/15 px-2.5 py-1 font-mono text-[0.56rem] font-bold uppercase tracking-[0.1em] text-leaf">
                  ✓ verified
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 font-mono text-[0.56rem] font-bold uppercase tracking-[0.1em] text-gold">
                  ◷ pending
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-cream px-5 py-3 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-muted">
          <span>Representative snapshot</span>
          <span className="font-bold text-leaf">Every figure, a sheet</span>
        </div>
      </div>
    </div>
  );
}
