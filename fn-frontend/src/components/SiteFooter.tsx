export function SiteFooter() {
  return (
    <footer className="bg-forest-deep px-6 py-[clamp(3.5rem,7vw,5.5rem)] text-[#cdd6c4] md:px-[clamp(1.5rem,7vw,7.5rem)]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-10">
        <div className="min-w-[280px] flex-1 basis-[360px]">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-lime" aria-hidden />
            <span className="text-[1.18rem] font-bold text-cream">Fair Nigeria</span>
          </div>
          <p className="max-w-[44ch] leading-relaxed text-[#8fa088]">
            A parallel record any citizen can verify. Not a replacement for INEC — a way to compare,
            trace, and trust.
          </p>
          <p className="mt-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[#6f7e68]">
            An independent civic project
          </p>
        </div>

        <nav className="flex flex-col gap-3" aria-label="Footer">
          <span className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#6f7e68]">
            Explore
          </span>
          <a href="#turnout" className="transition-colors hover:text-lime-bright">
            The 2023 Record
          </a>
          <a href="#civic" className="transition-colors hover:text-lime-bright">
            Civic Library
          </a>
          <a href="#results" className="transition-colors hover:text-lime-bright">
            Live Results
          </a>
        </nav>
      </div>

      <div className="mx-auto mt-[clamp(3rem,6vw,4rem)] flex max-w-[1400px] flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-[0.85rem] text-[#6f7e68]">
        <span>© 2026 Fair Nigeria. Built for the people.</span>
        <span>Unity and Faith, Peace and Progress.</span>
      </div>
    </footer>
  );
}
