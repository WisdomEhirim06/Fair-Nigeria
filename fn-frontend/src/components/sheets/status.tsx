import type { SheetStatus } from '@/lib/api';


export const SHEET_STATUS: Record<
  SheetStatus,
  { label: string; blurb: string; dot: string; chip: string }
> = {
  verified: {
    label: 'Verified',
    blurb: 'Two people read this sheet separately and recorded the same figures.',
    dot: 'var(--color-forest)',
    chip: 'bg-lime/25 text-forest-deep',
  },
  pending: {
    label: 'Being checked',
    blurb: 'This sheet is waiting for enough independent readings to agree.',
    dot: 'var(--color-gold)',
    chip: 'bg-gold/20 text-ink/75',
  },
  disputed: {
    label: 'Disputed',
    blurb: 'Readings of this sheet did not agree, so no figures were published from it.',
    dot: 'var(--color-error)',
    chip: 'bg-error/10 text-error',
  },
};

export function StatusChip({ status }: { status: SheetStatus }) {
  const s = SHEET_STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${s.chip}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} aria-hidden />
      {s.label}
    </span>
  );
}
