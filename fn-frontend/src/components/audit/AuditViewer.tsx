'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import { listAudit, type AuditEntry } from '@/lib/api';

const LIMIT = 25;

/**
 * One filter, in the reader's language.
 *
 * This was two dropdowns — a list of dotted action codes and a raw entity-type
 * list. Beta testers couldn't tell what either was for. The trail is now
 * scoped server-side to integrity-relevant actions, so this only has to split
 * the two things a person actually asks about.
 */
const SCOPES = [
  { value: '', label: 'Everything' },
  { value: 'sheet', label: 'Result sheets' },
  { value: 'election', label: 'Elections' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'An administrator',
  system: 'The system',
  yiaga_official: 'A field officer',
  yiaga_transcriber: 'A transcriber',
  citizen: 'A citizen',
};

function actorLabel(role: string | null): string {
  return role ? (ROLE_LABELS[role] ?? 'Someone') : 'A member of the public';
}

function str(meta: Record<string, unknown> | null, key: string): string | null {
  const v = meta?.[key];
  return typeof v === 'string' && v.trim() ? v : null;
}

/**
 * A full sentence describing what happened, rather than an action code and a
 * blob of JSON. Anything unrecognised falls back to a readable version of the
 * raw action so a newly-added backend event never renders as nothing.
 */
function describe(entry: AuditEntry): string {
  const who = actorLabel(entry.actorRole);
  const m = entry.metadata;

  switch (entry.action) {
    case 'election.create': {
      const name = str(m, 'name');
      return name ? `${who} created the election “${name}”.` : `${who} created an election.`;
    }
    case 'election.status_change': {
      const from = str(m, 'from');
      const to = str(m, 'to');
      if (from && to) return `${who} moved an election from ${from} to ${to}.`;
      return to ? `${who} set an election to ${to}.` : `${who} changed an election's status.`;
    }
    case 'election.party_add': {
      const abbr = str(m, 'abbreviation');
      return abbr ? `${who} added ${abbr} to the ballot.` : `${who} added a party to the ballot.`;
    }
    case 'election.party_update':
      return `${who} updated a party on the ballot.`;
    case 'election.party_remove':
      return `${who} removed a party from the ballot.`;
    case 'sheet.upload': {
      const pu = str(m, 'puCode');
      return pu
        ? `${who} uploaded the result sheet for polling unit ${pu}.`
        : `${who} uploaded a result sheet.`;
    }
    case 'sheet.flag':
      return `${who} flagged a result sheet for review.`;
    case 'consensus.resolve': {
      const outcome = str(m, 'outcome');
      if (outcome === 'verified') {
        return 'Two transcribers read this sheet the same way — its figures are now published.';
      }
      if (outcome === 'disputed') {
        return 'Transcribers did not agree on this sheet, so it was held back for review.';
      }
      return 'A sheet was resolved.';
    }
    default:
      return `${who} — ${entry.action.replace(/[._]/g, ' ')}.`;
  }
}

/** Sheets and consensus are the count itself; elections are the setup around it. */
function accentFor(action: string): string {
  const family = action.split('.')[0];
  if (family === 'consensus') return 'var(--color-leaf)';
  if (family === 'sheet') return 'var(--color-lime)';
  return 'var(--color-forest)';
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
function clock(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export function AuditViewer() {
  const [scope, setScope] = useState('');

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Bumped on every filter change, so a page that lands after the filter moved
  // is discarded instead of being appended to a list it doesn't belong to.
  const requestTicket = useRef(0);

  useEffect(() => {
    const ticket = ++requestTicket.current;
    setLoading(true);
    void (async () => {
      const rows = await listAudit({
        page: 1,
        limit: LIMIT,
        entityType: scope || undefined,
      }).catch(() => []);
      if (requestTicket.current !== ticket) return;
      setEntries(rows);
      setPage(1);
      setHasMore(rows.length === LIMIT);
      setLoading(false);
    })();
  }, [scope]);

  async function loadMore() {
    const ticket = requestTicket.current;
    const next = page + 1;
    setLoadingMore(true);
    const rows = await listAudit({
      page: next,
      limit: LIMIT,
      entityType: scope || undefined,
    }).catch(() => []);
    setLoadingMore(false);
    if (requestTicket.current !== ticket) return;
    setEntries((prev) => [...prev, ...rows]);
    setPage(next);
    setHasMore(rows.length === LIMIT);
  }

  const groups = useMemo(() => {
    const out: { day: string; items: AuditEntry[] }[] = [];
    for (const e of entries) {
      const day = dayKey(e.createdAt);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(e);
      else out.push({ day, items: [e] });
    }
    return out;
  }, [entries]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setScope(s.value)}
            aria-pressed={scope === s.value}
            className={`min-h-[44px] rounded-full px-4 text-[0.88rem] font-semibold transition-colors ${
              scope === s.value
                ? 'bg-ink text-cream'
                : 'border border-ink/15 text-ink/70 hover:border-ink/40 hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink motion-reduce:animate-none"
              role="status"
              aria-label="Loading"
            />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/50 px-6 py-16 text-center">
            <p className="text-[1rem] font-semibold">Nothing recorded yet</p>
            <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.9rem] text-muted">
              Once an election is set up and sheets start arriving, every step will appear here.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.day} className="mb-8">
              <p className="mb-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
                {group.day}
              </p>
              <div className="grid grid-cols-[auto_1fr] gap-x-4">
                {group.items.map((e) => (
                  <Fragment key={e.id}>
                    <div className="relative flex justify-center">
                      <span className="absolute inset-y-0 w-px bg-ink/12" aria-hidden />
                      <span
                        className="relative z-10 mt-2 h-2.5 w-2.5 rounded-full ring-4 ring-cream"
                        style={{ background: accentFor(e.action) }}
                        aria-hidden
                      />
                    </div>
                    <div className="pb-6">
                      <p className="text-[0.98rem] leading-relaxed">{describe(e)}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[0.8rem] text-muted">
                        <span className="font-mono">{clock(e.createdAt)}</span>
                        {/* The id builds the link but is never shown. */}
                        {e.entityType === 'sheet' && e.entityId ? (
                          <a
                            href={`/sheets/${e.entityId}`}
                            className="font-semibold text-leaf transition-colors hover:text-forest-deep"
                          >
                            See this sheet
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          ))
        )}

        {!loading && hasMore ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="min-h-[48px] rounded-full border border-ink/20 px-6 text-[0.9rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-ink/[0.04] disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Show older'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
