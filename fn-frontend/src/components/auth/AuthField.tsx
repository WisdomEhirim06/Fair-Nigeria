'use client';

import { useId, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
  autoComplete?: string;
  digitsOnly?: boolean;
};

// Text Input
export function AuthField({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  inputMode,
  maxLength,
  autoComplete,
  digitsOnly = false,
}: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(digitsOnly ? e.target.value.replace(/\D/g, '') : e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-14 w-full rounded-xl border bg-white px-4 pb-1 pt-5 text-[1rem] text-ink outline-none transition-colors focus:ring-2 ${
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-ink/15 focus:border-lime focus:ring-lime/20'
          }`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 origin-left text-muted transition-all duration-200 ${
            floated ? 'top-2 text-[0.7rem] font-medium' : 'top-1/2 -translate-y-1/2 text-[1rem]'
          }`}
        >
          {label}
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
