'use client';

import { useEffect, useState } from 'react';

import { ApiError, flagSheet } from '@/lib/api';

const REASONS = [
  'The figures look altered',
  'The sheet is unreadable',
  'This is the wrong polling unit',
  'The sheet looks incomplete',
];


export function FlagDialog({
  sheetId,
  puCode,
  onClose,
  onFlagged,
}: {
  sheetId: string;
  puCode: string;
  onClose: () => void;
  onFlagged: (flagCount: number) => void;
}) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  async function submit() {
    setSaving(true);
    setError(null);
    // Prefer the free-text detail; fall back to the chosen reason.
    const text = detail.trim() || reason;
    try {
      const res = await flagSheet(sheetId, text || undefined);
      onFlagged(res.flagCount);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === 'ALREADY_SUBMITTED'
            ? 'You have already flagged this sheet. One flag per person, per sheet.'
            : err.message,
        );
      } else {
        setError('Could not record the flag. Check your connection and try again.');
      }
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Flag this sheet"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-6 sm:max-w-[440px] sm:rounded-3xl"
      >
        {done ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime/25">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest-deep)" strokeWidth="2.2" aria-hidden>
                <path d="M4 12.5 10 18 20 6" />
              </svg>
            </span>
            <h2 className="mt-4 text-[1.2rem] font-bold tracking-[-0.02em]">Flag recorded</h2>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
              Thank you. Your flag is on the public record and this sheet will be looked at. The
              figures are never changed by a flag alone.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-ink py-3 text-[0.9rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h2 className="text-[1.2rem] font-bold tracking-[-0.02em]">Flag this sheet</h2>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
              Tell us what looks wrong with{' '}
              <span className="font-mono font-semibold text-ink">{puCode}</span>. Your flag is
              public and permanent, but it never alters the figures on its own.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(reason === r ? '' : r)}
                  aria-pressed={reason === r}
                  className={`rounded-full px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
                    reason === r
                      ? 'bg-ink text-cream'
                      : 'border border-ink/15 text-ink/70 hover:border-ink/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[0.82rem] font-medium text-ink/80">
                Anything else? (optional)
              </span>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, 300))}
                rows={3}
                maxLength={300}
                className="w-full resize-y rounded-xl border border-ink/15 bg-white p-3 text-[0.9rem] outline-none transition-colors focus:border-lime focus:ring-2 focus:ring-lime/20"
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-lg bg-error/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-error">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving}
                className="rounded-full bg-error py-3 text-[0.9rem] font-semibold text-cream transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Sending…' : 'Submit flag'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2 text-[0.88rem] font-semibold text-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
