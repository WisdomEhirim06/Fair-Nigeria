'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getCurrentElection,
  getMyRating,
  listElections,
  type Election,
  type Rating,
} from '@/lib/api';
import { AppShell } from '@/components/app/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { ElectionsPanel } from '@/components/dashboard/ElectionsPanel';
import { YourDetails } from '@/components/dashboard/YourDetails';
import { RatingCard } from '@/components/rating/RatingCard';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { useSession } from '@/lib/session/SessionProvider';

function DashboardInner() {
  const { user, signIn } = useSession();
  const [election, setElection] = useState<Election | null | undefined>(undefined);
  const [elections, setElections] = useState<Election[] | undefined>(undefined);
  const [rating, setRating] = useState<Rating | null | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const all = await listElections().catch(() => []);
    setElections(
      [...all].sort((a, b) => b.electionDate.localeCompare(a.electionDate)),
    );

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
  const firstName = user?.fullName.trim().split(' ')[0] ?? '';

  return (
    <>
      <div className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-10 sm:px-6 sm:pt-12">
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-leaf">
          Your account
        </p>
        <h1 className="mt-2 text-[clamp(1.6rem,5vw,2.4rem)] font-extrabold tracking-[-0.03em]">
          {firstName ? `Welcome, ${firstName}` : 'Welcome'}
        </h1>

        {/*
          Rating first — it's the one thing a citizen is here to do. Everything
          below is reference: when the next election is, what we hold on file,
          and where to go next.
        */}
        <div className="mt-8 flex flex-col gap-5">
          <RatingCard
            election={election}
            rating={rating}
            hasNin={Boolean(user?.hasNin)}
            onStartRating={() => setDialogOpen(true)}
          />

          <ElectionsPanel elections={elections} />

          {/* `signIn` re-reads /auth/me, so an added state shows immediately. */}
          {user ? <YourDetails user={user} onUpdated={() => void signIn()} /> : null}

          <QuickLinks />
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

const LINKS = [
  {
    href: '/articles',
    title: 'Civic library',
    body: 'What should and shouldn’t happen at a polling unit.',
  },
  {
    href: '/results',
    title: 'Results and ratings',
    body: 'The count as it comes in, and how people rated their LGA.',
  },
  {
    href: '/sheets',
    title: 'Result sheets',
    body: 'The original paper behind every published figure.',
  },
];

function QuickLinks() {
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-7">
      <h2 className="text-[1.15rem] font-bold tracking-[-0.01em]">Explore</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-ink/10 p-4 transition-colors hover:border-leaf/50 hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <p className="text-[0.95rem] font-semibold">{l.title}</p>
            <p className="mt-1 text-[0.83rem] leading-relaxed text-muted">{l.body}</p>
          </a>
        ))}
      </div>
    </section>
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
