'use client';

import { useState } from 'react';

const LINKS = [
  { href: '#turnout', label: 'The 2023 Record' },
  { href: '#civic', label: 'Civic Library' },
  { href: '#results', label: 'Results' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/85 backdrop-blur">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 md:px-[clamp(1.5rem,7vw,7.5rem)]">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full bg-lime" aria-hidden />
          <span className="text-[1.15rem] font-bold tracking-tight">Fair Nigeria</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[0.98rem] font-medium text-ink/70 transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#dashboard"
            className="rounded-full border border-ink/25 px-5 py-2 text-[0.95rem] font-semibold transition-colors hover:border-lime hover:bg-lime/10"
          >
            View dashboard
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            {open ? (
              <>
                <line x1="3" y1="3" x2="15" y2="15" />
                <line x1="15" y1="3" x2="3" y2="15" />
              </>
            ) : (
              <>
                <line x1="2" y1="5" x2="16" y2="5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13" x2="16" y2="13" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-ink/10 bg-cream px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[1.05rem] font-medium text-ink/80"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#dashboard"
              onClick={() => setOpen(false)}
              className="rounded-full bg-ink px-5 py-2.5 text-center font-semibold text-cream"
            >
              View dashboard
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
