'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentElection, listMyUploads, type Election, type Sheet } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useUploadQueue } from '@/lib/offline/useUploadQueue';
import { useOnline } from '@/lib/pwa/useOnline';
import { useSession } from '@/lib/session/SessionProvider';
import { PendingUploads } from './PendingUploads';
import { StatusPill } from './StatusPill';
import { UploadForm } from './UploadForm';

type Mode = 'list' | 'upload' | 'confirm' | 'queued';

export function UploadConsole() {
  const { user } = useSession();
  const online = useOnline();
  const queue = useUploadQueue();
  const [election, setElection] = useState<Election | null | undefined>(undefined);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [justUploaded, setJustUploaded] = useState<Sheet | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const current = await getCurrentElection().catch(() => null);
    setElection(current);
    if (current && current.status !== 'upcoming') {
      setSheets(await listMyUploads({ electionId: current.id, limit: 50 }).catch(() => []));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the relative times fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  function handleUploaded(sheet: Sheet) {
    setSheets((prev) => [sheet, ...prev]);
    setJustUploaded(sheet);
    setMode('confirm');
  }

  // A sheet that couldn't be sent is saved on the device, not lost.
  function handleQueued() {
    void queue.refresh();
    setMode('queued');
  }

  const prevQueued = useRef(0);
  useEffect(() => {
    const drained = prevQueued.current > 0 && queue.items.length === 0;
    prevQueued.current = queue.items.length;
    if (!drained || !election || election.status === 'upcoming') return;
    void listMyUploads({ electionId: election.id, limit: 50 })
      .then(setSheets)
      .catch(() => undefined);
  }, [queue.items.length, election]);

  const uploadOpen = election && election.status !== 'upcoming';

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

  if (mode === 'upload' && election) {
    return (
      <UploadForm
        election={election}
        defaultStateName={user?.state ?? null}
        onUploaded={handleUploaded}
        onQueued={handleQueued}
        onCancel={() => setMode('list')}
      />
    );
  }

  if (mode === 'confirm' && justUploaded) {
    return (
      <Confirmation
        sheet={justUploaded}
        onAnother={() => setMode('upload')}
        onDone={() => setMode('list')}
      />
    );
  }

  if (mode === 'queued') {
    return (
      <QueuedConfirmation
        online={online}
        waiting={queue.items.length}
        onAnother={() => setMode('upload')}
        onDone={() => setMode('list')}
      />
    );
  }

  // Election not open for uploads.
  if (!uploadOpen) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-12">
        <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
          Field officer
        </p>
        <h1 className="mt-3 text-[clamp(1.8rem,5vw,2.6rem)] font-extrabold tracking-[-0.03em]">
          Nothing to upload yet
        </h1>
        <p className="mt-3 max-w-[52ch] text-[0.98rem] leading-relaxed text-muted">
          {election
            ? 'Uploads open once the election is under way. Check back on election day.'
            : 'No election is set up yet. You will be able to send sheets here once one begins.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
            {election.name}
          </p>
          <h1 className="mt-2 text-[clamp(1.7rem,5vw,2.4rem)] font-extrabold tracking-[-0.03em]">
            My sheets
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className="shrink-0 rounded-full bg-ink px-5 py-3 text-[0.88rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
        >
          + Upload
        </button>
      </div>

      {/* Anything still on the device comes first — it needs attention. */}
      {queue.items.length > 0 ? (
        <div className="mt-7">
          <PendingUploads
            items={queue.items}
            online={online}
            flushing={queue.flushing}
            onRetry={() => void queue.flush({ force: true })}
            onDiscard={(id) => void queue.discard(id)}
          />
        </div>
      ) : null}

      {sheets.length === 0 && queue.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/20 bg-white/50 px-6 py-12 text-center">
          <p className="text-[0.95rem] font-medium text-muted">
            You haven’t sent any sheets yet.
          </p>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
          >
            Send your first sheet
          </button>
        </div>
      ) : sheets.length === 0 ? null : (
        <ul className="mt-7 flex flex-col gap-3">
          {sheets.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-ink/12 bg-white px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-[0.9rem] font-semibold">{s.puCode}</p>
                <p className="mt-1 flex items-center gap-2 font-mono text-[0.7rem] text-muted">
                  <span className="truncate">#{s.fileHash.slice(0, 10)}</span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0">{timeAgo(s.createdAt, now)}</span>
                </p>
              </div>
              <StatusPill status={s.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Shown when a sheet couldn't reach the server. The tone matters: nothing has
 * gone wrong from the officer's side, and nothing is lost — so this reassures
 * rather than alarms.
 */
function QueuedConfirmation({
  online,
  waiting,
  onAnother,
  onDone,
}: {
  online: boolean;
  waiting: number;
  onAnother: () => void;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pb-24 pt-14 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.5l3.5 2" />
        </svg>
      </span>
      <h1 className="mt-6 text-[clamp(1.5rem,5vw,2.1rem)] font-extrabold tracking-[-0.03em]">
        Saved on your phone
      </h1>
      <p className="mt-3 text-[0.96rem] leading-relaxed text-muted">
        {online
          ? 'This sheet couldn’t be sent just now, so it’s stored safely here and will go through on its own.'
          : 'You’re offline, so this sheet is stored safely here. It sends by itself the moment you have signal.'}
      </p>
      <p className="mt-3 font-mono text-[0.78rem] text-muted">
        {waiting} sheet{waiting === 1 ? '' : 's'} waiting
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <button
          type="button"
          onClick={onAnother}
          className="rounded-full bg-ink py-3.5 text-[0.92rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
        >
          Capture another
        </button>
        <button
          type="button"
          onClick={onDone}
          className="py-2 text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink"
        >
          Back to my sheets
        </button>
      </div>
    </div>
  );
}

function Confirmation({
  sheet,
  onAnother,
  onDone,
}: {
  sheet: Sheet;
  onAnother: () => void;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pb-24 pt-14 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime/25">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest-deep)" strokeWidth="2.2" aria-hidden>
          <path d="M4 12.5 10 18 20 6" />
        </svg>
      </span>
      <h1 className="mt-6 text-[clamp(1.6rem,5vw,2.2rem)] font-extrabold tracking-[-0.03em]">
        Sheet locked in
      </h1>
      <p className="mt-3 text-[0.96rem] leading-relaxed text-muted">
        Your sheet for <span className="font-mono font-semibold text-ink">{sheet.puCode}</span> is
        stored and fingerprinted. It can’t be changed — transcribers will read the figures next.
      </p>

      <div className="mt-6 rounded-xl border border-ink/12 bg-white px-5 py-4 text-left">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">Fingerprint</p>
        <p className="mt-1 break-all font-mono text-[0.8rem] text-ink/80">{sheet.fileHash}</p>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <button
          type="button"
          onClick={onAnother}
          className="rounded-full bg-ink py-3.5 text-[0.92rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
        >
          Upload another
        </button>
        <button
          type="button"
          onClick={onDone}
          className="py-2 text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink"
        >
          Back to my sheets
        </button>
      </div>
    </div>
  );
}
