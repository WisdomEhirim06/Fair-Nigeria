'use client';

import { useEffect } from 'react';

import type { Election } from '@/lib/api';
import { RatingFlow } from './RatingFlow';


export function RatingDialog({ election, onClose }: { election: Election; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-screen w-full flex-col overflow-hidden bg-cream sm:max-h-[92vh] sm:max-w-[520px] sm:rounded-3xl sm:shadow-[0_30px_80px_rgba(15,31,23,0.3)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Rate the election"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <span className="flex items-center gap-2 text-[0.95rem] font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
            Fair Nigeria
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <RatingFlow election={election} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
