'use client';

import { useState } from 'react';

import { homePathFor } from '@/lib/auth/roles';
import { useSession } from '@/lib/session/SessionProvider';


const LINKS = [
  { href: '/articles', label: 'Know your power' },
  { href: '/results', label: 'Election results' },
  { href: '/sheets', label: 'Ballot box trails' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();

  const ctaHref = user ? homePathFor(user.role) : '/register';
  const ctaLabel = user ? 'Your dashboard' : 'Rate your election';

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-2.5 md:px-[clamp(1.5rem,7vw,7.5rem)]">
        <a
          href="/"
          className="flex items-center gap-2.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-leaf" aria-hidden />
          <span className="text-[1.05rem] font-bold tracking-[-0.01em]">Fair Nigeria</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded text-[0.85rem] font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href={ctaHref}
            className="inline-flex min-h-[40px] items-center rounded-full bg-ink px-5 text-[0.85rem] font-semibold text-cream transition-colors hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {ctaLabel}
          </a>
        </div>

        {/*
          Results sit outside the menu on mobile. Everything else here is a
          detour someone chooses; the count is the thing people arrive wanting
          to see, and it shouldn't cost a menu tap to reach.
        */}
        <div className="flex items-center gap-1 md:hidden">
          <a
            href="/results"
            className="inline-flex min-h-[44px] items-center rounded-full px-3 text-[0.9rem] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Results
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-ink/25 px-3.5 text-[0.85rem] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
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
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-ink/10 bg-cream px-6 pb-5 pt-2 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[52px] items-center border-b border-ink/10 text-[1.05rem] font-medium text-ink"
              >
                {l.label}
              </a>
            ))}
            <a
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="mt-5 flex min-h-[52px] items-center justify-center rounded-full bg-ink px-5 text-[1rem] font-semibold text-cream"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
