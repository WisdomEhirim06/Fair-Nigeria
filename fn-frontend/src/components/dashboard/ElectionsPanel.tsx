'use client';

import type { Election } from '@/lib/api';

const STATUS_COPY: Record<Election['status'], { label: string; tone: string }> = {
  active: { label: 'Open now', tone: 'bg-leaf/15 text-leaf' },
  upcoming: { label: 'Not started', tone: 'bg-gold/15 text-gold' },
  concluded: { label: 'Finished', tone: 'bg-ink/[0.07] text-muted' },
};

/**
 * What's coming and what's been.
 *
 * The dashboard previously showed a single rating card, so with no active
 * election it read as an empty screen — the "there's no dashboard at all"
 * complaint from beta testing. Even with nothing open, seeing the election
 * calendar tells someone the thing is alive and when to come back.
 */
export function ElectionsPanel({ elections }: { elections: Election[] | undefined }) {
  if (elections === undefined) {
    return (
      <section className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-7">
        <div className="h-4 w-32 animate-pulse rounded bg-ink/10 motion-reduce:animate-none" />
        <div className="mt-5 h-14 w-full animate-pulse rounded-xl bg-ink/[0.06] motion-reduce:animate-none" />
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-7">
      <h2 className="text-[1.15rem] font-bold tracking-[-0.01em]">Elections</h2>
      <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted">
        You can rate an election while it’s open, and only once.
      </p>

      {elections.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-ink/20 px-5 py-8 text-center text-[0.9rem] text-muted">
          No elections have been set up yet. This is where they’ll appear.
        </p>
      ) : (
        <ul className="mt-5">
          {elections.map((e) => {
            const status = STATUS_COPY[e.status];
            return (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold">{e.name}</p>
                  <p className="mt-0.5 text-[0.82rem] text-muted">
                    <time dateTime={e.electionDate}>
                      {new Date(e.electionDate).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-mono text-[0.64rem] font-bold uppercase tracking-[0.12em] ${status.tone}`}
                >
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
