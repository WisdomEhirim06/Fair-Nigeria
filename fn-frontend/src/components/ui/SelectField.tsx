'use client';

import { useId, useState } from 'react';

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
};

/** Floating-label select, matching the auth form fields. */
export function SelectField({ label, value, onChange, options, disabled = false }: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`h-14 w-full appearance-none rounded-xl border border-ink/15 bg-white px-4 pb-1 pt-5 text-[1rem] outline-none transition-colors focus:border-lime focus:ring-2 focus:ring-lime/20 disabled:opacity-50 ${
          value ? 'text-ink' : 'text-transparent'
        }`}
      >
        <option value="" disabled hidden />
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 origin-left text-muted transition-all duration-200 ${
          floated ? 'top-2 text-[0.7rem] font-medium' : 'top-1/2 -translate-y-1/2 text-[1rem]'
        }`}
      >
        {label}
      </label>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/50" aria-hidden>
        ▾
      </span>
    </div>
  );
}
