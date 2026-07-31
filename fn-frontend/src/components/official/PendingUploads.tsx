'use client';

import { useState } from 'react';

import { MAX_AUTO_ATTEMPTS, type QueuedUpload } from '@/lib/offline/uploadQueue';


export function PendingUploads({
  items,
  online,
  flushing,
  onRetry,
  onDiscard,
}: {
  items: QueuedUpload[];
  online: boolean;
  flushing: boolean;
  onRetry: () => void;
  onDiscard: (id: string) => void;
}) {
  const stuck = items.some((i) => i.attempts >= MAX_AUTO_ATTEMPTS);

  return (
    <section
      className={`rounded-2xl border p-5 ${
        stuck ? 'border-error/35 bg-error/[0.04]' : 'border-gold/40 bg-gold/[0.07]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.98rem] font-bold tracking-[-0.01em]">
            Waiting to send ({items.length})
          </h2>
          <p className="mt-1 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">
            {!online
              ? 'Saved on this phone. They’ll send by themselves once you have signal.'
              : stuck
                ? 'These have failed several times. Try again, or discard one if it was a mistake.'
                : 'Sending these now. You can keep capturing while they go.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={!online || flushing}
          className="shrink-0 rounded-full border border-ink/20 px-4 py-2 text-[0.83rem] font-semibold text-ink transition-colors enabled:hover:border-lime enabled:hover:bg-lime/10 disabled:opacity-45"
        >
          {flushing ? 'Sending…' : 'Send now'}
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <PendingRow key={item.id} item={item} onDiscard={onDiscard} />
        ))}
      </ul>
    </section>
  );
}

function PendingRow({
  item,
  onDiscard,
}: {
  item: QueuedUpload;
  onDiscard: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const stuck = item.attempts >= MAX_AUTO_ATTEMPTS;

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-mono text-[0.86rem] font-semibold">{item.puCode}</p>
        <p className="mt-0.5 font-mono text-[0.68rem] text-muted">
          {(item.blob.size / 1024).toFixed(0)} KB
          {item.attempts > 0 ? ` · ${item.attempts} attempt${item.attempts === 1 ? '' : 's'}` : ''}
          {stuck ? ' · needs attention' : ''}
        </p>
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onDiscard(item.id)}
            className="rounded-lg bg-error px-2.5 py-1.5 text-[0.76rem] font-semibold text-cream"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2.5 py-1.5 text-[0.76rem] font-semibold text-muted hover:text-ink"
          >
            Keep
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-semibold text-muted transition-colors hover:text-error"
        >
          Discard
        </button>
      )}
    </li>
  );
}
