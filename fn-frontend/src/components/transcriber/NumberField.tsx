'use client';

import { useId } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  invalid?: boolean;
};

/** A labelled integer input. Keeps its value as a string so an empty box stays empty. */
export function NumberField({ label, value, onChange, hint, invalid = false }: Props) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.82rem] font-medium text-ink/80">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          // Digits only — no signs, decimals, or separators.
          const next = e.target.value.replace(/[^0-9]/g, '');
          onChange(next);
        }}
        className={`h-12 w-full rounded-xl border bg-white px-3.5 font-mono text-[0.95rem] tabular-nums outline-none transition-colors focus:ring-2 focus:ring-lime/20 ${
          invalid ? 'border-error focus:border-error' : 'border-ink/15 focus:border-lime'
        }`}
      />
      {hint ? <p className="mt-1 text-[0.72rem] text-muted">{hint}</p> : null}
    </div>
  );
}
