'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  listLgas,
  listSheets,
  listStates,
  type Lga,
  type Sheet,
  type SheetStatus,
  type StateOption,
} from '@/lib/api';
import { StatusChip } from './status';

const LIMIT = 24;

const STATUS_OPTIONS: { value: SheetStatus | ''; label: string }[] = [
  { value: '', label: 'All sheets' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Being checked' },
  { value: 'disputed', label: 'Disputed' },
];

export function SheetsBrowser() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [stateId, setStateId] = useState('');
  const [lgaId, setLgaId] = useState('');
  const [status, setStatus] = useState<SheetStatus | ''>('');

  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Bumped on every filter change. A response whose ticket is stale is thrown
  // away, so a page that arrives after the filters moved can't be appended to
  // a list it doesn't belong to.
  const requestTicket = useRef(0);

  useEffect(() => {
    void listStates()
      .then(setStates)
      .catch(() => setStates([]));
  }, []);

  // Cascade: a new state resets the LGA and reloads its list.
  useEffect(() => {
    setLgaId('');
    if (!stateId) {
      setLgas([]);
      return;
    }
    void listLgas(stateId)
      .then(setLgas)
      .catch(() => setLgas([]));
  }, [stateId]);

  // Reload from the first page whenever a filter changes.
  useEffect(() => {
    const ticket = ++requestTicket.current;
    setLoading(true);
    void (async () => {
      const rows = await listSheets({
        page: 1,
        limit: LIMIT,
        stateId: stateId || undefined,
        lgaId: lgaId || undefined,
        status: status || undefined,
      }).catch(() => []);
      if (requestTicket.current !== ticket) return;
      setSheets(rows);
      setPage(1);
      setHasMore(rows.length === LIMIT);
      setLoading(false);
    })();
  }, [stateId, lgaId, status]);

  const loadMore = useCallback(async () => {
    const ticket = requestTicket.current;
    const next = page + 1;
    setLoadingMore(true);
    const rows = await listSheets({
      page: next,
      limit: LIMIT,
      stateId: stateId || undefined,
      lgaId: lgaId || undefined,
      status: status || undefined,
    }).catch(() => []);
    setLoadingMore(false);
    // The filters moved while this page was in flight — discard it.
    if (requestTicket.current !== ticket) return;
    setSheets((prev) => [...prev, ...rows]);
    setPage(next);
    setHasMore(rows.length === LIMIT);
  }, [page, stateId, lgaId, status]);

  const filtered = Boolean(stateId || lgaId || status);
  const selectClass =
    'h-11 rounded-xl border border-ink/15 bg-white px-3 text-[0.88rem] text-ink outline-none transition-colors focus:border-lime focus:ring-2 focus:ring-lime/20 disabled:opacity-50';

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pb-24">
      {/* Hero */}
      <section className="pt-10 sm:pt-14">
        <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-leaf">
          The paper trail
        </p>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(2rem,6vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          Every number came from <span className="text-lime">a piece of paper.</span>
        </h1>
        <p className="mt-4 max-w-[56ch] text-[1.02rem] leading-relaxed text-muted">
          These are the result sheets photographed at polling units, exactly as they arrived. Open
          any one to see the sheet itself and the figures read from it — and say so if something
          looks wrong.
        </p>
      </section>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select
          value={stateId}
          onChange={(e) => setStateId(e.target.value)}
          className={selectClass}
          aria-label="State"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={lgaId}
          onChange={(e) => setLgaId(e.target.value)}
          disabled={!stateId}
          className={selectClass}
          aria-label="Local government"
        >
          <option value="">{stateId ? 'All local governments' : 'Pick a state first'}</option>
          {lgas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SheetStatus | '')}
          className={selectClass}
          aria-label="Status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setStateId('');
              setLgaId('');
              setStatus('');
            }}
            className="h-11 rounded-xl px-3 text-[0.85rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Contact sheet */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-lime motion-reduce:animate-none"
              role="status"
              aria-label="Loading"
            />
          </div>
        ) : sheets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/50 px-6 py-16 text-center">
            <p className="text-[1rem] font-semibold">
              {filtered ? 'No sheets match this filter' : 'No sheets yet'}
            </p>
            <p className="mx-auto mt-1.5 max-w-[44ch] text-[0.9rem] text-muted">
              {filtered
                ? 'Try a wider area, or clear the filters.'
                : 'Sheets appear here as field officers upload them on election day.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sheets.map((s) => (
                <SheetTile key={s.id} sheet={s} />
              ))}
            </div>

            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-full border border-ink/20 px-6 py-3 text-[0.9rem] font-semibold text-ink transition-colors hover:border-lime hover:bg-lime/10 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Show more sheets'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * One sheet in the contact grid.
 *
 * Only ever renders `thumbUrl` — never `fileUrl`. The originals are phone
 * photos of several megabytes each, so a 24-tile grid of them would cost a
 * reader tens of megabytes of mobile data. Without a thumbnail we show a paper
 * placeholder and download nothing; the full sheet lives one tap away.
 */
function SheetTile({ sheet }: { sheet: Sheet }) {
  return (
    <a href={`/sheets/${sheet.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl border border-ink/10 bg-white transition-all group-hover:-translate-y-0.5 group-hover:border-lime/60 group-hover:shadow-[0_16px_36px_rgba(15,31,23,0.10)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-ink/[0.04]">
          {sheet.thumbUrl ? (
            <img
              src={sheet.thumbUrl}
              alt={`Result sheet for polling unit ${sheet.puCode}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <PaperPlaceholder puCode={sheet.puCode} />
          )}
          <div className="absolute left-2 top-2">
            <StatusChip status={sheet.status} />
          </div>
        </div>

        <div className="px-3.5 py-3">
          <p className="truncate font-mono text-[0.85rem] font-semibold">{sheet.puCode}</p>
          <p className="mt-1 flex items-center gap-2 font-mono text-[0.66rem] text-muted">
            <span className="truncate">#{sheet.fileHash.slice(0, 8)}</span>
            {sheet.flagCount > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span className="shrink-0 text-error">
                  {sheet.flagCount} flag{sheet.flagCount === 1 ? '' : 's'}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </article>
    </a>
  );
}

/** A drawn stand-in for the sheet — costs nothing to load. */
function PaperPlaceholder({ puCode }: { puCode: string }) {
  return (
    <div className="flex h-full flex-col justify-between bg-[linear-gradient(160deg,rgba(22,39,30,0.05),rgba(22,39,30,0.02))] p-4">
      <div className="flex flex-col gap-1.5 pt-6" aria-hidden>
        <span className="h-1.5 w-3/4 rounded-full bg-ink/12" />
        <span className="h-1.5 w-1/2 rounded-full bg-ink/10" />
        <span className="mt-2 h-1.5 w-5/6 rounded-full bg-ink/10" />
        <span className="h-1.5 w-2/3 rounded-full bg-ink/[0.08]" />
      </div>
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink/35">
        View sheet
      </span>
      <span className="sr-only">Result sheet for polling unit {puCode}</span>
    </div>
  );
}
