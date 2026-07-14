'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import type { Role } from '@/lib/api';
import { useSession } from '@/lib/session/SessionProvider';


export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { status, user } = useSession();
  const router = useRouter();

  const wrongRole = status === 'authenticated' && roles && user ? !roles.includes(user.role) : false;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (wrongRole) {
      // Signed in but not allowed here — send to their home.
      router.replace('/dashboard');
    }
  }, [status, wrongRole, router]);

  if (status !== 'authenticated' || wrongRole) {
    return <AuthLoading />;
  }
  return <>{children}</>;
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink motion-reduce:animate-none"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
