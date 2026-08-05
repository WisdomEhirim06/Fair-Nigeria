'use client';

import { useState } from 'react';

import { addMyDetails, ApiError, type ApiUser } from '@/lib/api';
import { StateSelect } from '@/components/auth/StateSelect';
import { NIGERIAN_STATES } from '@/components/auth/states';

/**
 * The account, shown but not editable.
 *
 * Name, phone, and email are fixed. Phone is the login identity, and an account
 * that can quietly change hands would undermine the one-person-one-rating
 * guarantee the record rests on. What this does offer is filling in a blank:
 * someone who registered without a state can add one here, once.
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
        <Row
          label="Member since"
          value={new Date(user.createdAt).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        />
      </dl>

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
 * Shown only when the account has no state. Rating is scored per LGA, so
 * without a state there's nothing to attach a rating to — this is the one
 * blank worth chasing.
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
    <div className="mt-6 rounded-2xl bg-gold/[0.08] p-5">
      <p className="text-[0.95rem] font-semibold">Add your state</p>
      <p className="mt-1 text-[0.86rem] leading-relaxed text-muted">
        We need this to know which local government your rating belongs to. You can only set it
        once.
      </p>
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
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-4 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[0.92rem] font-semibold text-cream transition-colors hover:bg-forest-deep disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save state'}
      </button>
    </div>
  );
}
