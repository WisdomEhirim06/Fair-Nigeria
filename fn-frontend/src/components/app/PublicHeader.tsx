'use client';

import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/results', label: 'Results' },
  { href: '/audit', label: 'Audit' },
];

/**
 * Header for guests on the public pages. Sized so nothing wraps or spills out
 * of its button at any width — compact type, fixed height, no-wrap labels.
 */
export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-5 md:px-8">
        <a href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
          <span className="text-[0.98rem] font-bold tracking-[-0.01em]">Fair Nigeria</span>
        </a>

        <nav className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[0.82rem] font-medium transition-colors ${
                  active ? 'bg-ink/[0.06] text-ink' : 'text-ink/55 hover:text-ink'
                }`}
              >
                {l.label}
              </a>
            );
          })}
          <a
            href="/register"
            className="ml-1 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-[0.82rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
          >
            Rate
            <span className="hidden sm:inline"> the election</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
