'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { ApiError, requestOtp, verifyOtp } from '@/lib/api';

const OTP_SECONDS = 300;

type Props = {
  phone: string;
  active: boolean;
  onBack: () => void;
  onVerified: () => void;
};

export function OtpForm({ phone, active, onBack, onVerified }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [seconds, setSeconds] = useState(OTP_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  
  useEffect(() => {
    if (!active) return;
    setSeconds(OTP_SECONDS);
    inputRef.current?.focus();
  }, [active]);

  useEffect(() => {
    if (!active || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, seconds]);

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setVerifying(true);
    try {
      // On success this stores the access token and sets the refresh cookie.
      await verifyOtp(phone, code);
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    try {
      await requestOtp(phone);
      setSeconds(OTP_SECONDS);
      setError(undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code.');
    }
  }

  return (
    <form onSubmit={handleVerify} noValidate>
      <button
        type="button"
        onClick={onBack}
        className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted/80 transition-colors hover:text-ink"
      >
        Change number
      </button>

      <h1 className="mt-4 text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        Verify your number
      </h1>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
        Enter the 6-digit code we sent to your number.
      </p>

      <div className="mt-7">
        <input
          ref={inputRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''));
            setError(undefined);
          }}
          aria-label="6-digit verification code"
          aria-invalid={Boolean(error)}
          className={`h-16 w-full rounded-xl border bg-white text-center font-mono text-[1.6rem] tracking-[0.5em] text-ink outline-none transition-colors focus:ring-2 ${
            error
              ? 'border-error focus:ring-error/20'
              : 'border-ink/15 focus:border-lime focus:ring-lime/20'
          }`}
        />
        {error ? <p className="mt-1.5 font-mono text-[0.7rem] text-error">{error}</p> : null}
      </div>

      <button
        type="submit"
        disabled={verifying}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[1rem] font-semibold text-cream transition hover:bg-lime hover:text-ink disabled:opacity-60"
      >
        {verifying ? 'Verifying…' : 'Verify'}
      </button>

      <p className="mt-5 text-center font-mono text-[0.72rem] text-muted">
        {seconds > 0 ? (
          <>Didn’t get it? Resend in {mmss}</>
        ) : (
          <button
            type="button"
            onClick={resend}
            className="font-semibold text-leaf underline decoration-2 underline-offset-4"
          >
            Resend code
          </button>
        )}
      </p>
    </form>
  );
}
