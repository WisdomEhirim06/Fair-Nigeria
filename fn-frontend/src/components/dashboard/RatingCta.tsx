'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { getMyRating, type Election, type Rating } from '@/lib/api';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { useSession } from '@/lib/session/SessionProvider';

/**
 * The one place anyone rates an election, whatever their role — staff are
 * citizens too. Guests are pointed at registration instead.
 */
export function RatingCta({ election }: { election: Election }) {
  const { status } = useSession();
  const [rating, setRating] = useState<Rating | null | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    setRating(await getMyRating(election.id).catch(() => null));
  }, [status, election.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Rating only makes sense once voting is under way.
  if (election.status === 'upcoming') return null;

  if (status !== 'authenticated') {
    return (
      <Frame
        title="Add your rating"
        body="Rate what you saw at your polling unit. It takes under a minute and joins the public record."
      >
        <a
          href="/register"
          className="inline-flex rounded-full bg-ink px-5 py-2.5 text-[0.86rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
        >
          Sign up to rate
        </a>
      </Frame>
    );
  }

  if (rating) {
    return (
      <Frame
        title="You’ve rated this election"
        body="Your rating is counted in the figures above. Thank you for adding to the record."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-lime/20 px-4 py-2 text-[0.82rem] font-semibold text-forest-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden />
          Rating submitted
        </span>
      </Frame>
    );
  }

  return (
    <>
      <Frame
        title="Add your rating"
        body="Rate what you saw at your polling unit. It takes under a minute and joins the figures above."
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={rating === undefined}
          className="inline-flex rounded-full bg-ink px-5 py-2.5 text-[0.86rem] font-semibold text-cream transition-colors enabled:hover:bg-lime enabled:hover:text-ink disabled:opacity-50"
        >
          Rate the election
        </button>
      </Frame>

      {open ? (
        <RatingDialog
          election={election}
          onClose={() => {
            setOpen(false);
            void load();
          }}
        />
      ) : null}
    </>
  );
}

function Frame({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-lime/35 bg-lime/[0.07] p-6 sm:p-7">
      <h3 className="text-[1.1rem] font-bold tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
