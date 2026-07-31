'use client';

import { useEffect, type ReactNode } from 'react';

/** Page title block for a CMS section, with an optional action on the right. */
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-leaf">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-[clamp(1.5rem,4vw,2.1rem)] font-extrabold tracking-[-0.03em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[56ch] text-[0.92rem] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink/10 bg-white ${className}`}>{children}</div>
  );
}

type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';
const TONE: Record<Tone, string> = {
  neutral: 'bg-ink/[0.06] text-ink/70',
  positive: 'bg-lime/20 text-forest-deep',
  warning: 'bg-gold/15 text-ink/75',
  danger: 'bg-error/10 text-error',
  info: 'bg-forest/10 text-forest-deep',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink motion-reduce:animate-none"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-white/50 px-6 py-12 text-center">
      <p className="text-[0.98rem] font-semibold">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.88rem] text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Primary and secondary button classes, so buttons look identical everywhere. */
export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-cream transition-colors enabled:hover:bg-lime enabled:hover:text-ink disabled:opacity-40';
export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/20 px-4 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors enabled:hover:border-lime enabled:hover:bg-lime/10 disabled:opacity-40';

/** A centered modal used for create/edit forms and confirmations. */
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-6 sm:rounded-3xl ${
          wide ? 'sm:max-w-[560px]' : 'sm:max-w-[440px]'
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[1.2rem] font-bold tracking-[-0.02em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Labelled text input for admin forms. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.82rem] font-medium text-ink/80">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[0.76rem] font-medium text-error">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[0.76rem] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  'h-11 w-full rounded-xl border border-ink/15 bg-white px-3.5 text-[0.92rem] text-ink outline-none transition-colors focus:border-lime focus:ring-2 focus:ring-lime/20';
export const selectClass =
  'h-11 w-full appearance-none rounded-xl border border-ink/15 bg-white px-3.5 text-[0.92rem] text-ink outline-none transition-colors focus:border-lime focus:ring-2 focus:ring-lime/20';
