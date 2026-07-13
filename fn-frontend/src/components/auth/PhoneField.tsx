'use client';

import { useId } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
};

// Phone input with a fixed +234 prefix
export function PhoneField({ value, onChange, onBlur, error }: Props) {
  const id = useId();

  return (
    <div>
      <div className="relative">
        <div
          className={`flex h-14 items-end rounded-xl border bg-white transition-colors focus-within:ring-2 ${
            error
              ? 'border-error focus-within:ring-error/20'
              : 'border-ink/15 focus-within:border-lime focus-within:ring-lime/20'
          }`}
        >
          <span className="pb-1 pl-4 pr-1.5 font-mono text-[1rem] text-ink/70" aria-hidden>
            +234
          </span>
          <input
            id={id}
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
            onBlur={onBlur}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-full flex-1 rounded-r-xl bg-transparent pb-1 pr-4 pt-5 text-[1rem] text-ink outline-none"
          />
        </div>
        <label htmlFor={id} className="pointer-events-none absolute left-4 top-2 text-[0.7rem] font-medium text-muted">
          Phone number
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 font-mono text-[0.7rem] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
