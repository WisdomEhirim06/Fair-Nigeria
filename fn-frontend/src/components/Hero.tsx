import { NigeriaDotMap } from './NigeriaDotMap';

export function Hero() {
  return (
    <header
      id="top"
      className="relative overflow-hidden px-6 pb-[clamp(4rem,9vw,8rem)] pt-[clamp(2rem,5vw,4.5rem)] md:px-[clamp(1.5rem,7vw,7.5rem)]"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-[clamp(2rem,5vw,5rem)]">
        <div className="min-w-[280px] flex-1 basis-[360px]">
          <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-leaf">
            <span className="inline-block h-px w-6 bg-lime" aria-hidden />
            Citizen-led electoral transparency
          </span>
          <h1 className="mt-7 text-[clamp(2.6rem,6.2vw,5.4rem)] font-extrabold leading-[0.97] tracking-[-0.035em]">
            Show up.
            <br />
            Then watch every vote <span className="text-lime">get counted.</span>
          </h1>
          <p className="mt-7 max-w-[46ch] text-[clamp(1.05rem,1.4vw,1.3rem)] leading-relaxed text-muted">
            A record any citizen can verify — civic knowledge, LGA ratings, and results you can
            trace, sheet by sheet.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#civic"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-cream transition hover:-translate-y-0.5 hover:bg-lime hover:text-ink"
            >
              Know your power <span aria-hidden>→</span>
            </a>
            <a
              href="#dashboard"
              className="inline-flex items-center gap-2 border-b-[1.5px] border-ink/30 py-2 font-semibold transition-colors hover:border-lime"
            >
              View the dashboard <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        <div className="min-w-[280px] flex-1 basis-[340px]">
          <NigeriaDotMap className="mx-auto block w-full max-w-[520px]" />
          <p className="mt-3 text-center font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
            774 local government areas · one record
          </p>
        </div>
      </div>
    </header>
  );
}
