'use client';

import { useState, type FormEvent } from 'react';

import { ApiError, registerStaff } from '@/lib/api';
import { AuthField } from './AuthField';
import { PhoneField } from './PhoneField';

type FieldKey = 'fullName' | 'email' | 'nin' | 'phone' | 'inviteCode';
type Errors = Partial<Record<FieldKey, string>>;

const FIELD_MAP: Record<string, FieldKey> = {
  fullName: 'fullName',
  email: 'email',
  ninHash: 'nin',
  phoneNumber: 'phone',
  inviteCode: 'inviteCode',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The invite code is what differentiate the citizen registration from the official.
export function StaffRegisterForm({ onSubmit }: { onSubmit: (phone: string) => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nin, setNin] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  function clear(key: FieldKey) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setFormError(undefined);
  }

  function validate(): Errors {
    const next: Errors = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email — your code is sent here.';
    if (!/^\d{11}$/.test(nin)) next.nin = 'Your NIN is 11 digits.';
    if (!/^\d{10}$/.test(phone)) next.phone = 'Enter the 10 digits after +234.';
    if (!inviteCode.trim()) next.inviteCode = 'Enter the invite code from your coordinator.';
    return next;
  }

  function applyApiError(err: unknown) {
    if (err instanceof ApiError && err.field && FIELD_MAP[err.field]) {
      setErrors((prev) => ({ ...prev, [FIELD_MAP[err.field as string]]: err.message }));
    } else {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(undefined);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await registerStaff({
        fullName: fullName.trim(),
        phoneNumber: `+234${phone}`,
        email: email.trim(),
        nin,
        inviteCode: inviteCode.trim(),
      });
      onSubmit(`+234${phone}`);
    } catch (err) {
      applyApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        Create your staff account
      </h1>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
        Use the invite code from your coordinator. Your NIN is hashed on your device, never sent or
        stored. We’ll email you a code to confirm it’s really you.
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
          label="Email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            clear('email');
          }}
          error={errors.email}
          autoComplete="email"
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
        <AuthField
          label="Invite code"
          value={inviteCode}
          onChange={(v) => {
            setInviteCode(v);
            clear('inviteCode');
          }}
          error={errors.inviteCode}
          maxLength={120}
          autoComplete="off"
        />
      </div>

      {formError ? (
        <p className="mt-4 font-mono text-[0.75rem] text-error">{formError}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[1rem] font-semibold text-cream transition hover:bg-lime hover:text-ink disabled:opacity-60"
      >
        {submitting ? 'Sending code…' : 'Create account'}
      </button>

      <p className="mt-5 text-center text-[0.95rem] text-muted">
        Already registered?{' '}
        <a
          href="/login"
          className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4"
        >
          Log in
        </a>
      </p>
    </form>
  );
}
