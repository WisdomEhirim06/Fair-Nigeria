'use client';

import { useState, type FormEvent } from 'react';

import { AuthField } from './AuthField';
import { PhoneField } from './PhoneField';
import { StateSelect } from './StateSelect';

type FieldKey = 'fullName' | 'nin' | 'phone' | 'state';
type Errors = Partial<Record<FieldKey, string>>;

/** onSubmit fires once the form validates; it advances to the OTP step. */
export function RegisterForm({ onSubmit }: { onSubmit: () => void }) {
  const [fullName, setFullName] = useState('');
  const [nin, setNin] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function clear(key: FieldKey) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!/^\d{11}$/.test(nin)) next.nin = 'Your NIN is 11 digits.';
    if (!/^\d{10}$/.test(phone)) next.phone = 'Enter the 10 digits after +234.';
    if (!state) next.state = 'Choose your state.';
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    // Stub: the wired version will SHA-256 the NIN on-device and POST /auth/register.
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        Create your account
      </h1>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
        It takes a minute. Your NIN is hashed on your device, never sent or stored.
      </p>

      <div className="mt-7 space-y-3.5">
        <AuthField
          label="Full name"
          value={fullName}
          onChange={(v) => {
            setFullName(v);
            clear('fullName');
          }}
          error={errors.fullName}
          autoComplete="name"
        />
        <AuthField
          label="NIN (11 digits)"
          value={nin}
          onChange={(v) => {
            setNin(v);
            clear('nin');
          }}
          error={errors.nin}
          inputMode="numeric"
          maxLength={11}
          digitsOnly
        />
        <PhoneField
          value={phone}
          onChange={(v) => {
            setPhone(v);
            clear('phone');
          }}
          error={errors.phone}
        />
        <StateSelect
          value={state}
          onChange={(v) => {
            setState(v);
            clear('state');
          }}
          error={errors.state}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[1rem] font-semibold text-cream transition hover:bg-lime hover:text-ink disabled:opacity-60"
      >
        {submitting ? 'Sending code…' : 'Create account'}
      </button>

      <p className="mt-5 text-center text-[0.95rem] text-muted">
        Already registered?{' '}
        <a href="/login" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
          Log in
        </a>
      </p>
    </form>
  );
}
