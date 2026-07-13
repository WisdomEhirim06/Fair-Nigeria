'use client';

import { useState, type FormEvent } from 'react';

import { PhoneField } from './PhoneField';

/** onSubmit fires once the phone validates; it advances to the OTP step. */
export function LoginForm({ onSubmit }: { onSubmit: () => void }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter the 10 digits after +234.');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        Welcome back
      </h1>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
        Enter your phone number and we’ll text you a code to sign in.
      </p>

      <div className="mt-7">
        <PhoneField
          value={phone}
          onChange={(v) => {
            setPhone(v);
            setError(undefined);
          }}
          error={error}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[1rem] font-semibold text-cream transition hover:bg-lime hover:text-ink disabled:opacity-60"
      >
        {submitting ? 'Sending code…' : 'Send code'}
      </button>

      <p className="mt-5 text-center text-[0.95rem] text-muted">
        New here?{' '}
        <a
          href="/register"
          className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4"
        >
          Create an account
        </a>
      </p>
    </form>
  );
}
