import { CollationLedger } from './CollationLedger';

export function Hero() {
  return (
    <header
      id="top"
      className="relative overflow-hidden px-6 pb-[clamp(4rem,9vw,8rem)] pt-[clamp(3rem,6vw,6rem)] md:px-[clamp(1.5rem,7vw,7.5rem)]"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-[clamp(2rem,5vw,5rem)]">
        <div className="min-w-[280px] flex-1 basis-[360px]">
          <span className="inline-flex items-center font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-leaf">
            Citizen-led electoral transparency
          </span>
          <h1 className="mt-7 text-[clamp(2.6rem,6.2vw,5.4rem)] font-extrabold leading-[0.97] tracking-[-0.035em]">
            Show up.
            <br />
            Then watch every vote <span className="text-lime">get counted.</span>
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#ratings"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-cream transition hover:-translate-y-0.5 hover:bg-lime hover:text-ink"
            >
              Rate your election
            </a>
            <a
              href="#verify"
              className="inline-flex items-center gap-2 border-b-[1.5px] border-ink/30 py-2 font-semibold transition-colors hover:border-lime"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2.5 text-[0.9rem] text-muted">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
            An independent parallel record. Not a replacement for INEC.
          </p>
        </div>

        <div className="min-w-[280px] flex-1 basis-[340px]">
          <CollationLedger className="w-full" />
        </div>
      </div>
    </header>
  );
}
