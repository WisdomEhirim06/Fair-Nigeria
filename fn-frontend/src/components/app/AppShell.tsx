'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { navFor, roleLabel } from '@/lib/auth/roles';
import { useSession } from '@/lib/session/SessionProvider';


export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();
  const pathname = usePathname();
  const links = navFor(user?.role);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-6 px-5 md:px-8">
          <div className="flex items-center gap-9">
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
              <span className="text-[0.98rem] font-bold tracking-[-0.01em]">Fair Nigeria</span>
            </span>

            {/*
              One nav at every width. With the trail moved to the footer each
              role has two destinations, which fits the bar on a phone — so the
              fixed bottom tab row that used to cover mobile is gone, and with
              it the permanent strip of screen it occupied.
            */}
            <nav aria-label="Main" className="flex items-center gap-5 sm:gap-7">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={`text-[0.85rem] font-medium transition-colors ${
                      active ? 'text-ink' : 'text-ink/55 hover:text-ink'
                    }`}
                  >
                    {l.label}
                  </a>
                );
              })}
            </nav>
          </div>

          <AccountMenu
            name={user?.fullName ?? ''}
            role={user ? roleLabel(user.role) : ''}
            onSignOut={() => void signOut()}
          />
        </div>
      </header>

      <main id="main">{children}</main>

      <AppFooter />
    </div>
  );
}

/**
 * Where the quiet links live.
 *
 * The transparency trail sits here rather than in the nav: it's the thing you
 * go looking for when you want to check something, not a destination anyone
 * needs day to day.
 */
function AppFooter() {
  return (
    <footer className="mt-16 border-t border-ink/10">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-8">
        <p className="text-[0.8rem] text-muted">
          An independent citizen record. Not a replacement for INEC.
        </p>
        <nav className="flex flex-wrap items-center gap-5 text-[0.8rem] font-medium text-ink/60">
          <a href="/articles" className="transition-colors hover:text-ink">
            Civic library
          </a>
          <a href="/sheets" className="transition-colors hover:text-ink">
            Result sheets
          </a>
          <a href="/audit" className="transition-colors hover:text-ink">
            Transparency trail
          </a>
        </nav>
      </div>
    </footer>
  );
}

/** Initial-badge button that opens a small menu holding identity + log out. */
function AccountMenu({
  name,
  role,
  onSignOut,
}: {
  name: string;
  role: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-[0.82rem] font-bold text-cream transition-transform hover:scale-105"
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-ink/12 bg-white shadow-[0_18px_40px_rgba(15,31,23,0.14)]"
        >
          <div className="border-b border-ink/8 px-4 py-3">
            <p className="truncate text-[0.9rem] font-semibold">{name}</p>
            <p className="mt-0.5 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-leaf">
              {role}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="w-full px-4 py-3 text-left text-[0.88rem] font-medium text-ink/80 transition-colors hover:bg-ink/[0.04] hover:text-ink"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

// A quiet placeholder for consoles that are scaffolded but not yet built.

export function ConsolePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-12">
      <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold tracking-[-0.03em]">
        {title}
      </h1>
      <p className="mt-4 max-w-[54ch] text-[0.98rem] leading-relaxed text-muted">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-ink/20 bg-white/50 px-6 py-10 text-center">
        <p className="text-[0.9rem] font-medium text-muted">This console is being built.</p>
      </div>
    </div>
  );
}
