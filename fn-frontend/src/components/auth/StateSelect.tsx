'use client';

import { useId, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  options: readonly string[];
};

// State dropdown
export function StateSelect({ value, onChange, onBlur, error, options }: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-14 w-full appearance-none rounded-xl border bg-white px-4 pb-1 pt-5 text-[1rem] outline-none transition-colors focus:ring-2 ${
            value ? 'text-ink' : 'text-transparent'
          } ${
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-ink/15 focus:border-lime focus:ring-lime/20'
          }`}
        >
          <option value="" disabled hidden />
          {options.map((s) => (
            <option key={s} value={s} className="text-ink">
              {s}
            </option>
          ))}
        </select>
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 origin-left text-muted transition-all duration-200 ${
            floated ? 'top-2 text-[0.7rem] font-medium' : 'top-1/2 -translate-y-1/2 text-[1rem]'
          }`}
        >
          State
        </label>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/50" aria-hidden>
          ▾
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 font-mono text-[0.7rem] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
