'use client';

import { homePathFor } from '@/lib/auth/roles';
import { useSession } from '@/lib/session/SessionProvider';


export function StartCta({ className = '' }: { className?: string }) {
  const { user } = useSession();

  return (
    <a
      href={user ? homePathFor(user.role) : '/register'}
      className={`inline-flex min-h-[52px] items-center rounded-full bg-ink px-8 text-[1.05rem] font-semibold text-cream transition-colors hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      {user ? 'Go to your dashboard' : 'Rate your election'}
    </a>
  );
}
