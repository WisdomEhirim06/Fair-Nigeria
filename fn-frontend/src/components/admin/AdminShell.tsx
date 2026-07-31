'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useSession } from '@/lib/session/SessionProvider';
import { AdminIcon, type AdminIconName } from './AdminIcons';

interface Item {
  href: string;
  label: string;
  icon: AdminIconName;
}

// The CMS sections. Overview is the role home; the rest are the built areas.
const NAV: Item[] = [
  { href: '/admin', label: 'Overview', icon: 'overview' },
  { href: '/admin/elections', label: 'Elections', icon: 'elections' },
  { href: '/admin/articles', label: 'Articles', icon: 'articles' },
  { href: '/admin/invites', label: 'Invite codes', icon: 'invites' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
];

/** Is `href` the active section? '/admin' matches only itself; others match their subtree. */
function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-forest-deep px-4 py-6 text-cream lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/10 bg-cream/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/15"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M2 4.5h14M2 9h14M2 13.5h14" />
          </svg>
        </button>
        <span className="flex items-center gap-2 text-[0.95rem] font-bold">
          <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
          Admin
        </span>
        <span className="w-9" aria-hidden />
      </div>

      {/* Mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-[80%] max-w-[300px] flex-col bg-forest-deep px-4 py-6 text-cream">
            <SidebarContent pathname={pathname} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <main id="main" className="mx-auto w-full max-w-[960px] px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { user, signOut } = useSession();
  const initial = user?.fullName.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <>
      <a href="/admin" onClick={onNavigate} className="mb-8 flex items-center gap-2.5 px-2">
        <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
        <span className="text-[1.02rem] font-bold tracking-[-0.01em]">Fair Nigeria</span>
      </a>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-medium transition-colors ${
                active
                  ? 'bg-cream/12 text-cream'
                  : 'text-cream/60 hover:bg-cream/[0.06] hover:text-cream'
              }`}
            >
              <span className={active ? 'text-lime' : 'text-cream/50'}>
                <AdminIcon name={item.icon} />
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-cream/12 pt-4">
        <a
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] font-medium text-cream/60 transition-colors hover:bg-cream/[0.06] hover:text-cream"
        >
          <span className="text-cream/50">
            <AdminIcon name="site" />
          </span>
          View site
        </a>

        <div className="mt-3 flex items-center gap-3 px-3 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-[0.82rem] font-bold text-forest-deep">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] font-semibold">{user?.fullName ?? ''}</p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-[0.76rem] font-medium text-cream/55 transition-colors hover:text-lime"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
