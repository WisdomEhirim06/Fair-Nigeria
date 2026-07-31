'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import { listAudit, type AuditEntry } from '@/lib/api';

const LIMIT = 25;

// Human labels for the actions we record. Unknown actions fall back to a
// prettified version of the raw code, so new backend actions still render.
const ACTION_LABELS: Record<string, string> = {
  'election.create': 'Election created',
  'election.status_change': 'Election status changed',
  'election.party_add': 'Party added',
  'election.party_update': 'Party updated',
  'election.party_remove': 'Party removed',
  'article.create': 'Article created',
  'article.update': 'Article updated',
  'article.publish': 'Article published',
  'article.unpublish': 'Article unpublished',
  'sheet.upload': 'Result sheet uploaded',
  'sheet.flag': 'Sheet flagged',
  'transcription.entry': 'Reading submitted',
  'consensus.resolve': 'Sheet resolved by agreement',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Admin',
  system: 'System',
  yiaga_official: 'Field officer',
  yiaga_transcriber: 'Transcriber',
  citizen: 'Citizen',
};

const ACTION_OPTIONS = Object.entries(ACTION_LABELS);
const ENTITY_OPTIONS = ['election', 'sheet', 'article'];

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, ' ');
}

function roleLabel(role: string | null) {
  return role ? (ROLE_LABELS[role] ?? role) : 'Member of the public';
}
function categoryColor(action: string) {
  switch (action.split('.')[0]) {
    case 'consensus':
    case 'sheet':
      return 'var(--color-lime)';
    case 'transcription':
      return 'var(--color-leaf)';
    case 'election':
      return 'var(--color-forest)';
    case 'article':
      return 'var(--color-gold)';
    default:
      return 'var(--color-muted)';
  }
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
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Bumped on every filter change, so a page that lands after the filters moved
  // is discarded instead of being appended to a list it doesn't belong to.
  const requestTicket = useRef(0);

  // Reload from the first page whenever a filter changes.
  useEffect(() => {
    const ticket = ++requestTicket.current;
    setLoading(true);
    void (async () => {
      const rows = await listAudit({
        page: 1,
        limit: LIMIT,
        action: action || undefined,
        entityType: entityType || undefined,
      }).catch(() => []);
      if (requestTicket.current !== ticket) return;
      setEntries(rows);
      setPage(1);
      setHasMore(rows.length === LIMIT);
      setLoading(false);
    })();
  }, [action, entityType]);

  async function loadMore() {
    const ticket = requestTicket.current;
    const next = page + 1;
    setLoadingMore(true);
    const rows = await listAudit({
      page: next,
      limit: LIMIT,
      action: action || undefined,
      entityType: entityType || undefined,
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

  const filtered = Boolean(action || entityType);
  const selectClass =
    'h-11 rounded-xl border border-ink/15 bg-white px-3 text-[0.9rem] text-ink outline-none focus:border-lime focus:ring-2 focus:ring-lime/20';

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClass}>
          <option value="">All actions</option>
          {ACTION_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className={selectClass}
        >
          <option value="">Anything</option>
          {ENTITY_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setAction('');
              setEntityType('');
            }}
            className="h-11 rounded-xl px-3 text-[0.85rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Trail */}
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
          <p className="py-12 text-center text-[0.95rem] text-muted">
            {filtered ? 'Nothing matches these filters.' : 'No actions recorded yet.'}
          </p>
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
                        className="relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-cream"
                        style={{ background: categoryColor(e.action) }}
                        aria-hidden
                      />
                    </div>
                    <div className="pb-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[0.98rem] font-semibold">{actionLabel(e.action)}</span>
                        <span className="shrink-0 font-mono text-[0.72rem] text-muted">
                          {clock(e.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.8rem] text-muted">
                        <span className="rounded bg-ink/[0.06] px-2 py-0.5 font-medium">
                          {roleLabel(e.actorRole)}
                        </span>
                        <span className="capitalize">{e.entityType}</span>
                        {/* Sheet entries link through to the paper itself. The id
                            builds the link but is never shown. */}
                        {e.entityType === 'sheet' && e.entityId ? (
                          <a
                            href={`/sheets/${e.entityId}`}
                            className="font-medium text-leaf transition-colors hover:text-forest-deep"
                          >
                            View this sheet
                          </a>
                        ) : null}
                      </div>
                      {e.metadata && Object.keys(e.metadata).length > 0 ? (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[0.78rem] font-medium text-leaf">
                            See details
                          </summary>
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/[0.04] p-3 font-mono text-[0.68rem] leading-relaxed text-ink/80">
                            {JSON.stringify(e.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : null}
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
              className="rounded-full border border-ink/20 px-6 py-3 text-[0.9rem] font-semibold text-ink transition-colors hover:border-lime hover:bg-lime/10 disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load older'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
