'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import {
  claimNextSheet,
  flagSheet,
  getQueueStatus,
  type Claim,
  type SheetStatus,
  type TranscriptionResult,
} from '@/lib/api';
import { EntryForm } from './EntryForm';
import { SheetViewer } from './SheetViewer';

type Phase = 'loading' | 'start' | 'working' | 'confirm' | 'error';

export function TranscribeConsole() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [waiting, setWaiting] = useState(0);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [illegibleOpen, setIllegibleOpen] = useState(false);
  const [flagging, setFlagging] = useState(false);

  /** Land on the queue, never straight into a sheet. */
  const showQueue = useCallback(async () => {
    setPhase('loading');
    setResult(null);
    setClaim(null);
    setIllegibleOpen(false);
    try {
      const { waiting: n } = await getQueueStatus();
      setWaiting(n);
      setPhase('start');
    } catch {
      setPhase('error');
    }
  }, []);

  /** Ask the server for a sheet. It decides which — never the transcriber. */
  const startReading = useCallback(async () => {
    setPhase('loading');
    try {
      const next = await claimNextSheet();
      if (next) {
        setClaim(next);
        setPhase('working');
      } else {
        setWaiting(0);
        setPhase('start');
      }
    } catch {
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void showQueue();
  }, [showQueue]);

  async function confirmIllegible() {
    if (!claim) return;
    setFlagging(true);
    // Reuses the public flag with a reason; failure shouldn't strand the
    // transcriber, so we move on regardless.
    await flagSheet(claim.sheet.id, 'illegible').catch(() => undefined);
    setFlagging(false);
    await showQueue();
  }

  if (phase === 'loading') {
    return <Centered><Spinner /></Centered>;
  }

  if (phase === 'error') {
    return (
      <Centered>
        <div className="text-center">
          <p className="text-[1rem] font-semibold">Something went wrong.</p>
          <button
            type="button"
            onClick={() => void showQueue()}
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
          >
            Try again
          </button>
        </div>
      </Centered>
    );
  }

  if (phase === 'start') {
    return (
      <StartScreen waiting={waiting} onStart={() => void startReading()} onRefresh={() => void showQueue()} />
    );
  }

  if (phase === 'confirm' && result) {
    return <Confirmation status={result.sheetStatus} onNext={() => void showQueue()} />;
  }

  // phase === 'working'
  if (!claim) return null;
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 md:px-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:sticky lg:top-[4.5rem] lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-ink/12 bg-white lg:max-h-[calc(100vh-6rem)]">
            <SheetViewer sheet={claim.sheet} />
          </div>
        </div>
        <div className="rounded-2xl border border-ink/12 bg-white p-5 md:p-6">
          <EntryForm
            key={claim.sheet.id}
            claim={claim}
            onSubmitted={(r) => {
              setResult(r);
              setPhase('confirm');
            }}
            onFlagIllegible={() => setIllegibleOpen(true)}
          />
        </div>
      </div>

      {illegibleOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-[400px] rounded-2xl bg-cream p-6">
            <h3 className="text-[1.1rem] font-bold">Mark this sheet illegible?</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
              Use this when the sheet is too blurry, cut off, or the wrong page to read. It’s
              flagged for review and you’ll move on to the next one.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => void confirmIllegible()}
                disabled={flagging}
                className="rounded-full bg-error py-3 text-[0.9rem] font-semibold text-cream transition hover:opacity-90 disabled:opacity-60"
              >
                {flagging ? 'Flagging…' : 'Yes, flag as illegible'}
              </button>
              <button
                type="button"
                onClick={() => setIllegibleOpen(false)}
                className="py-2 text-[0.88rem] font-semibold text-muted transition-colors hover:text-ink"
              >
                Keep reading
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The transcriber's home. You see how much work is waiting and choose when to
 * begin — but the server still decides *which* sheet you get, so no one can
 * hand-pick a sheet to collude on.
 */
function StartScreen({
  waiting,
  onStart,
  onRefresh,
}: {
  waiting: number;
  onStart: () => void;
  onRefresh: () => void;
}) {
  const empty = waiting === 0;

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pb-20 pt-12 sm:pt-16">
      <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-leaf">
        Transcriber
      </p>
      <h1 className="mt-3 text-[clamp(1.6rem,5vw,2.3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
        {empty ? 'All caught up' : 'Ready when you are'}
      </h1>

      <div className="mt-7 rounded-3xl border border-ink/12 bg-white p-6 sm:p-7">
        <div className="flex items-baseline gap-3">
          <span className="text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
            {waiting}
          </span>
          <span className="text-[0.95rem] font-medium text-muted">
            {waiting === 1 ? 'sheet waiting' : 'sheets waiting'}
          </span>
        </div>

        <p className="mt-4 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">
          {empty
            ? 'Nothing needs a reading right now. More arrive as officers upload from the field.'
            : 'Sheets are handed out one at a time, and which one you get is decided for you — that’s what keeps each reading independent.'}
        </p>

        <div className="mt-6">
          {empty ? (
            <button
              type="button"
              onClick={onRefresh}
              className="w-full rounded-full border border-ink/20 py-3.5 text-[0.9rem] font-semibold text-ink transition-colors hover:border-lime hover:bg-lime/10"
            >
              Check again
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-full bg-ink py-3.5 text-[0.92rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
            >
              Start reading
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 text-[0.82rem] leading-relaxed text-muted">
        You get one reading per sheet. Two readings that match verify the result.
      </p>
    </div>
  );
}

const CONFIRM_COPY: Record<SheetStatus, { title: string; body: string; tone: string }> = {
  verified: {
    title: 'Verified',
    body: 'Your reading matched another. This sheet is now a verified result.',
    tone: 'var(--color-forest-deep)',
  },
  disputed: {
    title: 'Sent for review',
    body: 'The readings didn’t agree, so this sheet is disputed and an admin will review it.',
    tone: 'var(--color-error)',
  },
  pending: {
    title: 'Reading submitted',
    body: 'Thanks — we’re waiting on more readings to compare before this sheet is confirmed.',
    tone: 'var(--color-leaf)',
  },
};

function Confirmation({ status, onNext }: { status: SheetStatus; onNext: () => void }) {
  const copy = CONFIRM_COPY[status];
  return (
    <div className="mx-auto w-full max-w-[480px] px-6 pb-24 pt-16 text-center">
      <span
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, var(--color-lime) 22%, transparent)' }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={copy.tone} strokeWidth="2.2" aria-hidden>
          <path d="M4 12.5 10 18 20 6" />
        </svg>
      </span>
      <h1 className="mt-6 text-[clamp(1.6rem,5vw,2.2rem)] font-extrabold tracking-[-0.03em]">
        {copy.title}
      </h1>
      <p className="mt-3 text-[0.96rem] leading-relaxed text-muted">{copy.body}</p>
      <button
        type="button"
        onClick={onNext}
        className="mt-8 w-full rounded-full bg-ink py-3.5 text-[0.92rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
      >
        Back to the queue
      </button>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center">{children}</div>;
}
function Spinner() {
  return (
    <span
      className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink motion-reduce:animate-none"
      role="status"
      aria-label="Loading"
    />
  );
}
