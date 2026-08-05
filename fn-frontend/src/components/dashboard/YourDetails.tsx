'use client';

import { useState, type ReactNode } from 'react';

import { addMyDetails, ApiError, type ApiUser } from '@/lib/api';
import { AuthField } from '@/components/auth/AuthField';
import { StateSelect } from '@/components/auth/StateSelect';
import { NIGERIAN_STATES } from '@/components/auth/states';

/**
 * The account, shown but not editable.
 *
 * Name, phone, and email are fixed. Phone is the login identity, and an account
 * that could quietly change hands would undermine the one-person-one-rating
 * guarantee the record rests on. What this does offer is filling in blanks:
 * signup no longer asks for a NIN or requires a state, so both can be added
 * here — once each, never changed.
 */
export function YourDetails({ user, onUpdated }: { user: ApiUser; onUpdated: () => void }) {
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-7">
      <h2 className="text-[1.15rem] font-bold tracking-[-0.01em]">Your details</h2>
      <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted">
        These identify you on the record and can’t be changed here.
      </p>

      <dl className="mt-5">
        <Row label="Name" value={user.fullName} />
        <Row label="Phone" value={user.phoneNumber} hint="You sign in with this" />
        <Row label="Email" value={user.email} hint="Your sign-in code goes here" />
        {user.state ? <Row label="State" value={user.state} /> : null}
        {user.hasNin ? <Row label="NIN" value="On file" hint="Stored as a one-way hash" /> : null}
        <Row
          label="Member since"
          value={new Date(user.createdAt).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        />
      </dl>

      {user.hasNin ? null : <AddNin onUpdated={onUpdated} />}
      {user.state ? null : <AddState onUpdated={onUpdated} />}
    </section>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/[0.07] py-3 last:border-0">
      <dt className="shrink-0 text-[0.9rem] text-muted">{label}</dt>
      <dd className="min-w-0 text-right">
        <span className="block break-words text-[0.95rem] font-semibold">{value}</span>
        {hint ? <span className="mt-0.5 block text-[0.76rem] text-muted">{hint}</span> : null}
      </dd>
    </div>
  );
}

/**
 * `needed` marks the one that actually blocks something. The optional field
 * stays visually quiet so the two don't read as equally urgent — a page with
 * two identical yellow boxes teaches people to ignore both.
 */
function AddPanel({
  title,
  body,
  needed = false,
  children,
}: {
  title: string;
  body: string;
  needed?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`mt-6 rounded-2xl p-5 ${
        needed ? 'bg-gold/[0.10]' : 'border border-ink/10 bg-cream'
      }`}
    >
      <p className="text-[0.95rem] font-semibold">{title}</p>
      <p className="mt-1 text-[0.86rem] leading-relaxed text-muted">{body}</p>
      {children}
    </div>
  );
}

const SAVE_BUTTON =
  'mt-4 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[0.92rem] font-semibold text-cream transition-colors hover:bg-forest-deep disabled:opacity-60';

/**
 * Shown when no NIN is on file. This is what gates rating, so it comes first
 * and says why rather than just asking.
 */
function AddNin({ onUpdated }: { onUpdated: () => void }) {
  const [nin, setNin] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!/^\d{11}$/.test(nin)) {
      setError('Your NIN is 11 digits.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await addMyDetails({ nin });
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <AddPanel
      needed
      title="Add your NIN to rate"
      body="It’s how we make sure each person rates once. It’s scrambled on your device before it’s sent — we never see the number itself, and it can’t be worked backwards."
    >
      <div className="mt-4">
        <AuthField
          label="NIN (11 digits)"
          value={nin}
          onChange={(v) => {
            setNin(v);
            setError(undefined);
          }}
          error={error}
          inputMode="numeric"
          maxLength={11}
          digitsOnly
        />
      </div>
      <button type="button" onClick={() => void save()} disabled={saving} className={SAVE_BUTTON}>
        {saving ? 'Saving…' : 'Save NIN'}
      </button>
    </AddPanel>
  );
}

/**
 * Shown only when the account has no state.
 *
 * Deliberately not framed as a requirement: `RatingFlow` asks where you voted
 * each time and doesn't read this, so it's a profile detail rather than a
 * blocker. Overstating it would be the same mistake the old signup form made.
 */
function AddState({ onUpdated }: { onUpdated: () => void }) {
  const [state, setState] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!state) {
      setError('Choose your state.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await addMyDetails({ state });
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <AddPanel
      title="Add your state"
      body="Optional. It records where you’re based so we can show what’s happening near you. You’ll still choose where you voted each time you rate. You can only set it once."
    >
      <div className="mt-4">
        <StateSelect
          value={state}
          onChange={(v) => {
            setState(v);
            setError(undefined);
          }}
          error={error}
          options={NIGERIAN_STATES}
        />
      </div>
      <button type="button" onClick={() => void save()} disabled={saving} className={SAVE_BUTTON}>
        {saving ? 'Saving…' : 'Save state'}
      </button>
    </AddPanel>
  );
}
