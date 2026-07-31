'use client';

import type { PartyTotal } from '@/lib/api';
import { formatNumber } from '@/lib/format';


const BAR_COLORS = ['var(--color-lime)', 'var(--color-gold)', '#5b8f7a', '#9bb0a1'];
const colorFor = (i: number) => BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)];


export function PartyBars({ parties }: { parties: PartyTotal[] }) {
  const sorted = [...parties].sort((a, b) => b.votes - a.votes);
  const total = sorted.reduce((sum, p) => sum + p.votes, 0);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-px bg-ink/20 sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-1 left-1/2 z-20 hidden -translate-x-1/2 bg-white px-1.5 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-muted sm:block"
        aria-hidden
      >
        50% majority
      </div>

      <div className="relative z-10 space-y-3.5 pt-1">
        {sorted.map((p, i) => {
          const pct = total > 0 ? (p.votes / total) * 100 : 0;
          return (
            <div key={p.partyId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[0.98rem] font-bold">{p.abbreviation}</span>
                <span className="font-mono text-[0.85rem]">
                  <span className="font-bold text-ink">{pct.toFixed(1)}%</span>
                  <span className="ml-2 text-muted">{formatNumber(p.votes)}</span>
                </span>
              </div>
              <div className="h-3.5 overflow-hidden rounded-full bg-ink/[0.07]">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  style={{ width: `${pct}%`, background: colorFor(i) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
