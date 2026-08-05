'use client';

import type { ReactNode } from 'react';

import type { Election, Rating } from '@/lib/api';
import { RATING_QUESTIONS } from './questions';

const CARD = 'rounded-3xl border border-ink/10 bg-white p-6 sm:p-7';
const CTA =
  'mt-6 inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 font-semibold text-cream transition-colors hover:bg-forest-deep';

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
      {children}
    </p>
  );
}

/** The dashboard's rating entry point. Renders one of four states. */
export function RatingCard({
  election,
  rating,
  hasNin,
  onStartRating,
}: {
  election: Election | null | undefined;
  rating: Rating | null | undefined;
  hasNin: boolean;
  onStartRating: () => void;
}) {
  // Still fetching.
  if (election === undefined || rating === undefined) {
    return (
      <div className={`${CARD} animate-pulse motion-reduce:animate-none`}>
        <div className="h-3.5 w-24 rounded bg-ink/10" />
        <div className="mt-4 h-8 w-3/4 rounded bg-ink/10" />
        <div className="mt-3 h-4 w-full rounded bg-ink/10" />
        <div className="mt-6 h-12 w-44 rounded-full bg-ink/10" />
      </div>
    );
  }

  // No election set up yet, or still upcoming. it won't be open.
  if (!election || election.status === 'upcoming') {
    return (
      <div className={CARD}>
        <Eyebrow>Not open yet</Eyebrow>
        <h2 className="mt-3 text-[clamp(1.5rem,3.5vw,2.1rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          Voting hasn’t started.
        </h2>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
          When it does, you can rate what you saw where you voted. Meanwhile, get ready, learn what
          should and shouldn’t happen.
        </p>
        <a href="/articles" className={CTA}>
          Read the civic articles
        </a>
      </div>
    );
  }

  // If already rated it will show read-only summary and  link to the public results.
  if (rating) {
    return (
      <div className={CARD}>
        <Eyebrow>Rated</Eyebrow>
        <h2 className="mt-3 text-[clamp(1.5rem,3.5vw,2.1rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          Thanks! Your rating is in.
        </h2>
        <dl className="mt-5 space-y-0">
          {RATING_QUESTIONS.map((q) => (
            <div
              key={q.key}
              className="flex items-start justify-between gap-4 border-b border-ink/[0.08] py-2.5 text-[0.92rem] last:border-0"
            >
              <dt className="text-muted">{q.question}</dt>
              <dd className="shrink-0 font-semibold">{rating[q.key] ? 'Yes' : 'No'}</dd>
            </div>
          ))}
        </dl>
        <a href="/results" className={CTA}>
          View results and ratings
        </a>
      </div>
    );
  }

  // Open, but the account can't rate yet. Saying so here beats letting someone
  // fill in five questions and get rejected on submit.
  if (!hasNin) {
    return (
      <div className={CARD}>
        <Eyebrow>One step first</Eyebrow>
        <h2 className="mt-3 text-[clamp(1.5rem,3.5vw,2.1rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          Add your NIN to rate.
        </h2>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
          It’s how we make sure each person rates once. You’ll find it under “Your details” below —
          it takes a moment, and you only do it once.
        </p>
      </div>
    );
  }

  // Open and not yet rated
  return (
    <div className={CARD}>
      <Eyebrow>On the day</Eyebrow>
      <h2 className="mt-3 text-[clamp(1.5rem,3.5vw,2.1rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
        Rate the election around you.
      </h2>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
        Five quick yes/no questions about how voting went where you voted. It takes a minute, and
        you can only rate once.
      </p>
      <button type="button" onClick={onStartRating} className={CTA}>
        Start rating
      </button>
    </div>
  );
}
