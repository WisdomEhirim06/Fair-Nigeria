import type { SheetStatus } from '@/lib/api';

const STYLES: Record<SheetStatus, { label: string; dot: string; text: string; bg: string }> = {
  pending: {
    label: 'Pending',
    dot: 'var(--color-gold)',
    text: 'text-ink/70',
    bg: 'bg-gold/15',
  },
  verified: {
    label: 'Verified',
    dot: 'var(--color-forest)',
    text: 'text-forest-deep',
    bg: 'bg-lime/25',
  },
  disputed: {
    label: 'Disputed',
    dot: 'var(--color-error)',
    text: 'text-error',
    bg: 'bg-error/10',
  },
};

export function StatusPill({ status }: { status: SheetStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${s.bg} ${s.text}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} aria-hidden />
      {s.label}
    </span>
  );
}
