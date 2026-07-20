'use client';

import type { RatingScores } from '@/lib/api';

// Short labels for the dashboard
const ROWS: { key: keyof RatingScores; label: string }[] = [
  { key: 'noIntimidation', label: 'Voted without intimidation' },
  { key: 'accreditationProper', label: 'Accreditation done properly' },
  { key: 'votingOrderly', label: 'Voting was orderly' },
  { key: 'securityPresent', label: 'Security was present' },
  { key: 'witnessedMalpractice', label: 'Witnessed malpractice' },
];

/** The five criteria as "% who answered yes" meters. */
export function RatingBars({ scores }: { scores: RatingScores }) {
  return (
    <div className="space-y-3">
      {ROWS.map((r) => {
        const pct = Math.round(scores[r.key] * 100);
        return (
          <div key={r.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-[0.92rem]">{r.label}</span>
              <span className="font-mono text-[0.85rem] font-bold">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink/[0.07]">
              <div
                className="h-full rounded-full bg-leaf transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
