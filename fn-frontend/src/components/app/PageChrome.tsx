'use client';

import type { ReactNode } from 'react';

import { useSession } from '@/lib/session/SessionProvider';
import { AppShell } from './AppShell';
import { PublicHeader } from './PublicHeader';

/**
 * Chrome for pages that serve both guests and signed-in people (results, audit).
 *
 * Signed in, you get the full app shell — so your console is always one tap
 * away and you can never get stranded on a public page. Guests get the plain
 * public header. While the session is still resolving we show the public
 * chrome, so public content renders immediately rather than waiting on auth.
 */
export function PageChrome({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === 'authenticated') {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-cream">
      <PublicHeader />
      <main id="main">{children}</main>
    </div>
  );
}
