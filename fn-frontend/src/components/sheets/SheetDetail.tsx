'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getSheet,
  getSheetResult,
  listLgas,
  listStates,
  type Sheet,
  type SheetResult,
} from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { FlagDialog } from './FlagDialog';
import { SHEET_STATUS, StatusChip } from './status';

export function SheetDetail() {
  const { id } = useParams<{ id: string }>();
  const [sheet, setSheet] = useState<Sheet | null | undefined>(undefined);
  const [result, setResult] = useState<SheetResult | null>(null);
  const [place, setPlace] = useState<string>('');
  const [flagCount, setFlagCount] = useState(0);
  const [flagOpen, setFlagOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const s = await getSheet(id).catch(() => null);
      if (!active) return;
      setSheet(s);
      if (!s) return;
      setFlagCount(s.flagCount);

      // Figures and place names load independently of each other.
      void getSheetResult(id)
        .then((r) => active && setResult(r))
        .catch(() => undefined);

      const [states, lgas] = await Promise.all([
        listStates().catch(() => []),
        listLgas(s.stateId).catch(() => []),
      ]);
      if (!active) return;
      const stateName = states.find((x) => x.id === s.stateId)?.name ?? '';
      const lgaName = lgas.find((x) => x.id === s.lgaId)?.name ?? '';
      setPlace([lgaName, stateName].filter(Boolean).join(', '));
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (sheet === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-lime motion-reduce:animate-none"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (sheet === null) {
    return (
      <div className="mx-auto w-full max-w-[680px] px-6 py-24 text-center">
        <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">Sheet not found</h1>
        <p className="mt-3 text-[0.95rem] text-muted">This sheet may have been removed.</p>
        <a
          href="/sheets"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-[0.88rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
        >
          Back to the paper trail
        </a>
      </div>
    );
  }

  const meta = SHEET_STATUS[sheet.status];
  const isPdf = sheet.mimeType === 'application/pdf';

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pb-24">
      <a
        href="/sheets"
        className="mt-8 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-muted transition-colors hover:text-ink sm:mt-12"
      >
        <span aria-hidden>←</span> The paper trail
      </a>

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-[clamp(1.4rem,4vw,2rem)] font-extrabold tracking-[-0.02em]">
            {sheet.puCode}
          </h1>
          <StatusChip status={sheet.status} />
        </div>
        {place ? <p className="mt-1.5 text-[0.95rem] text-muted">{place}</p> : null}
        <p className="mt-3 max-w-[60ch] text-[0.92rem] leading-relaxed text-muted">{meta.blurb}</p>
      </header>

      {/* The paper, and what was read from it. */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <h2 className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
            The sheet
          </h2>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            {sheet.fileUrl && !isPdf ? (
              <a href={sheet.fileUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
                <img
                  src={sheet.fileUrl}
                  alt={`Result sheet for polling unit ${sheet.puCode}`}
                  className="w-full"
                />
              </a>
            ) : (
              <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
                <span className="rounded-lg bg-forest/10 px-3 py-2 font-mono text-[0.72rem] font-bold text-forest-deep">
                  {isPdf ? 'PDF' : 'Unavailable'}
                </span>
                {sheet.fileUrl ? (
                  <a
                    href={sheet.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-ink/20 px-5 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:border-lime hover:bg-lime/10"
                  >
                    Open the sheet
                  </a>
                ) : (
                  <p className="text-[0.9rem] text-muted">This sheet image can’t be shown.</p>
                )}
              </div>
            )}
          </div>

          {/* Provenance */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-white px-5 py-4">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted">
              Fingerprint
            </p>
            <p className="mt-1 break-all font-mono text-[0.76rem] leading-relaxed text-ink/80">
              {sheet.fileHash}
            </p>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
              A unique signature taken the moment this sheet arrived. If a single pixel changed,
              this code would change too.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
            The figures published from it
          </h2>

          {result ? (
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <div className="flex flex-col gap-3">
                {result.partyVotes
                  .slice()
                  .sort((a, b) => b.votes - a.votes)
                  .map((p) => (
                    <div key={p.partyId} className="flex items-baseline justify-between gap-4">
                      <span className="min-w-0">
                        <span className="font-mono text-[0.88rem] font-bold">{p.abbreviation}</span>
                        {p.candidateName ? (
                          <span className="ml-2 truncate text-[0.8rem] text-muted">
                            {p.candidateName}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-mono text-[1rem] font-bold tabular-nums">
                        {formatNumber(p.votes)}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="my-5 border-t border-ink/10" />

              <dl className="flex flex-col gap-2.5">
                <Row label="Accredited voters" value={result.accreditedVoters} />
                <Row label="Total valid votes" value={result.totalValidVotes} />
                <Row label="Rejected ballots" value={result.rejectedBallots} />
                <Row label="Total votes cast" value={result.totalVotesCast} strong />
              </dl>

              <p className="mt-5 rounded-xl bg-lime/[0.12] px-4 py-3 text-[0.82rem] leading-relaxed text-forest-deep">
                {result.agreedReadings} independent readings of this sheet produced exactly these
                figures. That agreement is why they were published.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-ink/20 bg-white/50 px-6 py-12 text-center">
              <p className="text-[0.95rem] font-semibold">No figures published yet</p>
              <p className="mx-auto mt-1.5 max-w-[38ch] text-[0.87rem] leading-relaxed text-muted">
                {sheet.status === 'disputed'
                  ? 'Readings of this sheet disagreed, so nothing from it counts toward the totals.'
                  : 'Nothing from this sheet counts toward the totals until two readings agree.'}
              </p>
            </div>
          )}

          {/* Flagging */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-white px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.88rem] font-semibold">Does something look wrong?</p>
                <p className="mt-0.5 text-[0.82rem] text-muted">
                  {flagCount > 0
                    ? `${flagCount} ${flagCount === 1 ? 'person has' : 'people have'} flagged this sheet.`
                    : 'Flagging is open to anyone. It never changes the figures.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFlagOpen(true)}
                className="shrink-0 rounded-full border border-ink/20 px-4 py-2 text-[0.85rem] font-semibold text-ink transition-colors hover:border-error hover:bg-error/[0.06] hover:text-error"
              >
                Flag this sheet
              </button>
            </div>
          </div>
        </section>
      </div>

      {flagOpen ? (
        <FlagDialog
          sheetId={sheet.id}
          puCode={sheet.puCode}
          onClose={() => setFlagOpen(false)}
          onFlagged={(count) => setFlagCount(count)}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`text-[0.87rem] ${strong ? 'font-semibold text-ink' : 'text-muted'}`}>
        {label}
      </dt>
      <dd
        className={`font-mono tabular-nums ${
          strong ? 'text-[0.95rem] font-bold' : 'text-[0.9rem] font-medium text-ink/85'
        }`}
      >
        {formatNumber(value)}
      </dd>
    </div>
  );
}
