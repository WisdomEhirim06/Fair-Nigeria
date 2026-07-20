'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  getCurrentElection,
  getRatingsDashboard,
  getResultsDashboard,
  type Election,
  type LgaRatingSummary,
  type RatingScores,
  type RatingsDashboard,
  type ResultsDashboard,
  type StateResultSummary,
} from '@/lib/api';
import { formatNumber, updatedAgo } from '@/lib/format';
import { PartyBars } from './PartyBars';
import { RatingBars } from './RatingBars';
import { RatingCta } from './RatingCta';

const ZERO_SCORES: RatingScores = {
  noIntimidation: 0,
  accreditationProper: 0,
  votingOrderly: 0,
  securityPresent: 0,
  witnessedMalpractice: 0,
};
const RATING_KEYS = Object.keys(ZERO_SCORES) as (keyof RatingScores)[];

/** Weighted-by-count average of the per-LGA yes-fractions. */
function aggregateRatings(lgas: LgaRatingSummary[]): { count: number; scores: RatingScores } {
  let count = 0;
  const sums: RatingScores = { ...ZERO_SCORES };
  for (const lga of lgas) {
    count += lga.count;
    for (const k of RATING_KEYS) sums[k] += lga.scores[k] * lga.count;
  }
  const scores: RatingScores = { ...ZERO_SCORES };
  if (count > 0) for (const k of RATING_KEYS) scores[k] = sums[k] / count;
  return { count, scores };
}

const CARD = 'rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_16px_40px_rgba(15,31,23,0.05)] sm:p-7';
const TOTAL_STATES = 37;

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[clamp(1.4rem,3.5vw,2rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
        {title}
      </h2>
    </div>
  );
}

export function PublicDashboard() {
  const [election, setElection] = useState<Election | null | undefined>(undefined);
  const [results, setResults] = useState<ResultsDashboard | null | undefined>(undefined);
  const [ratings, setRatings] = useState<RatingsDashboard | null | undefined>(undefined);
  const [stateId, setStateId] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // Load the election once, then poll both dashboards every 60s.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    void (async () => {
      const e = await getCurrentElection().catch(() => null);
      if (!active) return;
      setElection(e);
      if (!e) {
        setResults(null);
        setRatings(null);
        return;
      }
      const fetchAll = async () => {
        const [r, rt] = await Promise.all([
          getResultsDashboard(e.id).catch(() => null),
          getRatingsDashboard(e.id).catch(() => null),
        ]);
        if (!active) return;
        setResults(r);
        setRatings(rt);
      };
      await fetchAll();
      timer = setInterval(() => void fetchAll(), 60_000);
    })();
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  // Keep the "updated X ago" label fresh between fetches.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const nationalRatings = useMemo(() => aggregateRatings(ratings?.byLga ?? []), [ratings]);

  const stateOptions = useMemo(() => {
    const map = new Map<string, string>();
    results?.byState.forEach((s) => map.set(s.stateId, s.stateName));
    ratings?.byLga.forEach((l) => map.set(l.stateId, l.stateName));
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [results, ratings]);

  const selectedResults: StateResultSummary | undefined = results?.byState.find(
    (s) => s.stateId === stateId,
  );
  const selectedRatings = useMemo(
    () => aggregateRatings((ratings?.byLga ?? []).filter((l) => l.stateId === stateId)),
    [ratings, stateId],
  );

  const loading = election === undefined || results === undefined || ratings === undefined;
  const lastUpdated = results?.lastUpdated ?? ratings?.lastUpdated ?? null;
  const hasResults = (results?.national.partyTotals.length ?? 0) > 0;
  const statesReporting = results?.byState.length ?? 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink motion-reduce:animate-none"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-24">
      {/* Hero */}
      <section className="pt-10 sm:pt-12">
        <p className="flex items-center gap-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-leaf">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
          </span>
          Live record · {updatedAgo(lastUpdated, now)}
        </p>
        <h1 className="mt-3 text-[clamp(1.5rem,4.2vw,2.3rem)] font-extrabold leading-[1.08] tracking-[-0.025em] [text-wrap:balance]">
          {election ? election.name : 'The election'}
        </h1>
      </section>

      {/* Results */}
      <section className="mt-12 sm:mt-14">
        <SectionHead eyebrow="Collated results" title="Where the count stands" />
        <div className={CARD}>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <div className="text-[2rem] font-extrabold leading-none tracking-[-0.03em]">
                {statesReporting}
                <span className="text-[1.1rem] font-bold text-muted"> / {TOTAL_STATES}</span>
              </div>
              <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                states reporting
              </div>
            </div>
            <div className="flex gap-5 font-mono text-[0.72rem]">
              <span className="text-leaf">{formatNumber(results?.sheetCounts.verified ?? 0)} verified</span>
              <span className="text-gold">{formatNumber(results?.sheetCounts.disputed ?? 0)} disputed</span>
              <span className="text-muted">{formatNumber(results?.sheetCounts.pending ?? 0)} pending</span>
            </div>
          </div>

          <div className="my-5 border-t border-ink/8" />

          {hasResults && results ? (
            <>
              <PartyBars parties={results.national.partyTotals} />
              <p className="mt-5 font-mono text-[0.66rem] text-muted">
                Share of {formatNumber(results.national.figures.totalValidVotes)} valid votes across
                verified sheets. Disputed and pending sheets are not counted.
              </p>
            </>
          ) : (
            <p className="text-[0.95rem] leading-relaxed text-muted">
              Results appear here as field sheets are uploaded and verified. Nothing verified yet.
            </p>
          )}
        </div>
      </section>

      {/* Ratings */}
      <section className="mt-12 sm:mt-14">
        <SectionHead eyebrow="Citizen ratings" title="How voting felt, overall" />
        <div className={CARD}>
          {nationalRatings.count > 0 ? (
            <>
              <p className="mb-4 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted">
                {formatNumber(nationalRatings.count)} citizen{nationalRatings.count === 1 ? '' : 's'} · % who answered yes
              </p>
              <RatingBars scores={nationalRatings.scores} />
            </>
          ) : (
            <p className="text-[0.95rem] leading-relaxed text-muted">
              No ratings in yet. Citizens rate the process from the app once voting is open.
            </p>
          )}
        </div>
      </section>

      {/* Rating — the single entry point to rate, for every role. */}
      {election ? (
        <section className="mt-12 sm:mt-14">
          <RatingCta election={election} />
        </section>
      ) : null}

      {/* By state */}
      {stateOptions.length > 0 ? (
        <section className="mt-12 sm:mt-14">
          <SectionHead eyebrow="By state" title="Drill into a state" />
          <div className={CARD}>
            <select
              value={stateId}
              onChange={(e) => setStateId(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-ink/15 bg-white px-4 text-[1rem] text-ink outline-none focus:border-lime focus:ring-2 focus:ring-lime/20"
            >
              <option value="">Choose a state…</option>
              {stateOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {stateId ? (
              <div className="mt-6 space-y-7">
                <div>
                  <p className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-leaf">
                    Results
                  </p>
                  {selectedResults && selectedResults.partyTotals.length > 0 ? (
                    <PartyBars parties={selectedResults.partyTotals} />
                  ) : (
                    <p className="text-[0.92rem] text-muted">No verified results in this state yet.</p>
                  )}
                </div>
                <div>
                  <p className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-leaf">
                    Ratings{' '}
                    {selectedRatings.count > 0 ? (
                      <span className="text-muted">
                        · {formatNumber(selectedRatings.count)} citizen
                        {selectedRatings.count === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </p>
                  {selectedRatings.count > 0 ? (
                    <RatingBars scores={selectedRatings.scores} />
                  ) : (
                    <p className="text-[0.92rem] text-muted">No ratings in this state yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[0.92rem] text-muted">
                Pick a state to see its results and citizen ratings together.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {/* What this record is — the closing note, not a banner over the numbers. */}
      <footer className="mt-14 border-t border-ink/10 pt-6 sm:mt-16">
        <p className="flex items-start gap-2.5 text-[0.85rem] leading-relaxed text-muted">
          <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
          <span>
            <strong className="font-semibold text-ink">A citizen record, not an INEC
            declaration.</strong>{' '}
            Fair Nigeria is an independent parallel count, built so every figure traces back to a
            result sheet you can see for yourself.
          </span>
        </p>
      </footer>
    </div>
  );
}
