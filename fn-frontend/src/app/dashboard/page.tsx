'use client';

import { useCallback, useEffect, useState } from 'react';

import { getCurrentElection, getMyRating, type Election, type Rating } from '@/lib/api';
import { AppShell } from '@/components/app/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RatingCard } from '@/components/rating/RatingCard';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { useSession } from '@/lib/session/SessionProvider';

function DashboardInner() {
  const { user } = useSession();
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
    <>
      <div className="mx-auto w-full max-w-[560px] px-6 pb-16 pt-12">
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-leaf">
          Your account
        </p>
        <h1 className="mt-2 text-[clamp(1.6rem,5vw,2.4rem)] font-extrabold tracking-[-0.03em]">
          Welcome{user ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>

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
    </>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <AppShell>
        <DashboardInner />
      </AppShell>
    </RequireAuth>
  );
}
