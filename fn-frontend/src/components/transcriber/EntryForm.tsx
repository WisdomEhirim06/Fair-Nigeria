'use client';

import { useMemo, useState } from 'react';

import {
  ApiError,
  submitEntry,
  type Claim,
  type TranscriptionResult,
} from '@/lib/api';
import { NumberField } from './NumberField';

type Props = {
  claim: Claim;
  onSubmitted: (result: TranscriptionResult) => void;
  onFlagIllegible: () => void;
};

const num = (s: string): number | null => (s === '' ? null : Number.parseInt(s, 10));

export function EntryForm({ claim, onSubmitted, onFlagIllegible }: Props) {
  const [accredited, setAccredited] = useState('');
  const [valid, setValid] = useState('');
  const [rejected, setRejected] = useState('');
  const [cast, setCast] = useState('');
  const [votes, setVotes] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const setVote = (partyId: string, v: string) =>
    setVotes((prev) => ({ ...prev, [partyId]: v }));

  // Mirror the backend's tally rules as soft, live warnings. The backend stays
  // the final judge — these just catch mistakes before a wasted submit.
  const warnings = useMemo(() => {
    const out: string[] = [];
    const av = num(accredited);
    const tvv = num(valid);
    const rb = num(rejected);
    const tvc = num(cast);

    const partyNums = claim.parties.map((p) => num(votes[p.id] ?? ''));
    const allPartiesFilled = partyNums.every((n) => n !== null);
    if (allPartiesFilled && tvv !== null) {
      const sum = partyNums.reduce((a, n) => a + (n ?? 0), 0);
      if (sum !== tvv) {
        out.push(`Party votes add up to ${sum}, but total valid votes is ${tvv}.`);
      }
    }
    if (tvv !== null && rb !== null && tvc !== null && tvv + rb !== tvc) {
      out.push(
        `Valid votes (${tvv}) + rejected (${rb}) = ${tvv + rb}, but total cast is ${tvc}.`,
      );
    }
    if (tvc !== null && av !== null && tvc > av) {
      out.push(`Total votes cast (${tvc}) is more than accredited voters (${av}).`);
    }
    return out;
  }, [accredited, valid, rejected, cast, votes, claim.parties]);

  const ready =
    accredited !== '' &&
    valid !== '' &&
    rejected !== '' &&
    cast !== '' &&
    claim.parties.every((p) => (votes[p.id] ?? '') !== '');

  async function submit() {
    if (!ready) return;
    setConfirming(false);
    setSubmitting(true);
    setError(null);
    setErrorField(null);
    try {
      const partyVotes: Record<string, number> = {};
      for (const p of claim.parties) partyVotes[p.id] = Number.parseInt(votes[p.id], 10);
      const result = await submitEntry({
        sheetId: claim.sheet.id,
        accreditedVoters: Number.parseInt(accredited, 10),
        totalValidVotes: Number.parseInt(valid, 10),
        rejectedBallots: Number.parseInt(rejected, 10),
        totalVotesCast: Number.parseInt(cast, 10),
        partyVotes,
      });
      onSubmitted(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorField(err.field ?? null);
      } else {
        setError('Could not submit. Check your connection and try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[1.15rem] font-bold tracking-[-0.02em]">Enter the figures</h2>
        <p className="mt-1 text-[0.85rem] text-muted">
          Type exactly what the sheet shows. Three readings that match verify the result.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Accredited voters"
          value={accredited}
          onChange={setAccredited}
          invalid={errorField === 'accreditedVoters'}
        />
        <NumberField
          label="Total valid votes"
          value={valid}
          onChange={setValid}
          invalid={errorField === 'totalValidVotes'}
        />
        <NumberField
          label="Rejected ballots"
          value={rejected}
          onChange={setRejected}
          invalid={errorField === 'rejectedBallots'}
        />
        <NumberField
          label="Total votes cast"
          value={cast}
          onChange={setCast}
          invalid={errorField === 'totalVotesCast'}
        />
      </div>

      <div>
        <p className="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
          Party votes
        </p>
        <div className="flex flex-col gap-3">
          {claim.parties.map((p) => (
            <NumberField
              key={p.id}
              label={p.candidateName ? `${p.abbreviation} — ${p.candidateName}` : p.abbreviation}
              value={votes[p.id] ?? ''}
              onChange={(v) => setVote(p.id, v)}
              invalid={errorField === 'partyVotes'}
            />
          ))}
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
          <p className="text-[0.78rem] font-semibold text-ink/80">Double-check these:</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {warnings.map((w) => (
              <li key={w} className="text-[0.8rem] leading-snug text-ink/70">
                • {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-error/10 px-4 py-3 text-[0.85rem] font-medium text-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={!ready || submitting}
          className="rounded-full bg-ink py-3.5 text-[0.92rem] font-semibold text-cream transition enabled:hover:bg-lime enabled:hover:text-ink disabled:opacity-40"
        >
          {submitting ? 'Submitting…' : 'Submit reading'}
        </button>
        <button
          type="button"
          onClick={onFlagIllegible}
          className="py-1.5 text-[0.85rem] font-medium text-muted transition-colors hover:text-error"
        >
          Can’t read this sheet
        </button>
      </div>

      {confirming ? (
        <ConfirmSubmit
          puCode={claim.sheet.puCode}
          warnings={warnings}
          onConfirm={() => void submit()}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </div>
  );
}

/**
 * A reading is one-shot: you get exactly one per sheet and it can't be edited
 * or withdrawn afterwards. So we stop and say so before it's committed.
 */
function ConfirmSubmit({
  puCode,
  warnings,
  onConfirm,
  onCancel,
}: {
  puCode: string;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-[420px] rounded-2xl bg-cream p-6">
        <h3 className="text-[1.15rem] font-bold tracking-[-0.01em]">Submit this reading?</h3>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
          You get one reading per sheet. Once you submit for{' '}
          <span className="font-mono font-semibold text-ink">{puCode}</span>, it becomes part of the
          permanent record — it can’t be edited or taken back.
        </p>

        {warnings.length > 0 ? (
          <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
            <p className="text-[0.78rem] font-semibold text-ink/80">
              Your figures still don’t add up:
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {warnings.map((w) => (
                <li key={w} className="text-[0.78rem] leading-snug text-ink/70">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-ink py-3 text-[0.9rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
          >
            Yes, submit it
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="py-2 text-[0.88rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            Check again
          </button>
        </div>
      </div>
    </div>
  );
}
