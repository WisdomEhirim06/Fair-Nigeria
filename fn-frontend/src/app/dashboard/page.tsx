'use client';

import { useCallback, useEffect, useState } from 'react';

import { getCurrentElection, getMyRating, type Election, type Rating } from '@/lib/api';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RatingCard } from '@/components/rating/RatingCard';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { useSession } from '@/lib/session/SessionProvider';

function DashboardInner() {
  const { user, signOut } = useSession();
  const [election, setElection] = useState<Election | null | undefined>(undefined);
  const [rating, setRating] = useState<Rating | null | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const current = await getCurrentElection().catch(() => null);
    setElection(current);
    if (current && (current.status === 'active' || current.status === 'concluded')) {
      setRating(await getMyRating(current.id).catch(() => null));
    } else {
      setRating(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ratingOpen = election && (election.status === 'active' || election.status === 'concluded');

  return (
    <main id="main" className="min-h-screen bg-cream">
      <header className="flex items-center justify-between px-6 py-5 md:px-[clamp(1.5rem,7vw,7.5rem)]">
        <span className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
          <span className="text-[1.05rem] font-bold">Fair Nigeria</span>
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-full border border-ink/15 px-4 py-2 text-[0.85rem] font-semibold text-ink/80 transition-colors hover:border-ink hover:text-ink"
        >
          Log out
        </button>
      </header>

      <div className="mx-auto w-full max-w-[560px] px-6 pb-16 pt-4">
        <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
          Your account
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.6rem)] font-extrabold tracking-[-0.03em]">
          Welcome{user ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-2 text-[0.98rem] text-muted">
          This is your home. The full dashboard and results come next.
        </p>

        <div className="mt-8">
          <RatingCard
            election={election}
            rating={rating}
            onStartRating={() => setDialogOpen(true)}
          />
        </div>
      </div>

      {dialogOpen && ratingOpen && election ? (
        <RatingDialog
          election={election}
          onClose={() => {
            setDialogOpen(false);
            void load(); // reflect a just-submitted rating
          }}
        />
      ) : null}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
