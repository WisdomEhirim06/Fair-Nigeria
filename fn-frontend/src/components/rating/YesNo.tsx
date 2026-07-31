'use client';

// Semantic colouring wasn't used for the Yes/No components.

export function YesNo({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  const base =
    'h-12 rounded-xl border text-[0.98rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';
  const selected = 'border-ink bg-ink text-cream';
  const idle = 'border-ink/15 bg-white text-ink hover:border-ink/40';

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        aria-pressed={value === true}
        onClick={() => onChange(true)}
        className={`${base} ${value === true ? selected : idle}`}
      >
        Yes
      </button>
      <button
        type="button"
        aria-pressed={value === false}
        onClick={() => onChange(false)}
        className={`${base} ${value === false ? selected : idle}`}
      >
        No
      </button>
    </div>
  );
}
