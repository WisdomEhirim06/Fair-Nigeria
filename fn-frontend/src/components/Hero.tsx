import { CollationLedger } from './CollationLedger';
import { StartCta } from './StartCta';

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
            Then watch every vote <span className="text-leaf">get counted.</span>
          </h1>

          {/*
            This used to sit below the buttons in small muted type. A tester read
            the page as a game, so what the project actually is now appears
            before the first action, not after it.
          */}
          <p className="mt-6 max-w-[46ch] border-l-2 border-leaf/40 pl-4 text-[0.98rem] leading-relaxed text-ink/75">
            A public independent, citizen-run record of the election, for verification and accountability.
          </p>

          <StartCta className="mt-8" />
        </div>

        <div className="min-w-[280px] flex-1 basis-[340px]">
          <CollationLedger className="w-full" />
        </div>
      </div>
    </header>
  );
}
