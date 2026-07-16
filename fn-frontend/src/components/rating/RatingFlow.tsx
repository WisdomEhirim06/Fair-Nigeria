'use client';

import { useEffect, useRef, useState } from 'react';

import {
  ApiError,
  listLgas,
  listStates,
  submitRating,
  type Election,
  type Lga,
  type StateOption,
} from '@/lib/api';
import { SelectField } from '@/components/ui/SelectField';
import { RATING_QUESTIONS, type QuestionKey } from './questions';
import { YesNo } from './YesNo';

type Answers = Partial<Record<QuestionKey, boolean>>;

export function RatingFlow({ election, onClose }: { election: Election; onClose: () => void }) {
  const [states, setStates] = useState<StateOption[]>([]);
  const [stateId, setStateId] = useState('');
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [lgaLoading, setLgaLoading] = useState(false);
  const [lgaId, setLgaId] = useState('');
  const [answers, setAnswers] = useState<Answers>({});

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const steps = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll a newly-revealed step into view. Resolved inside rAF so the step has
  // committed to the DOM before we look for it. Respects reduced motion.
  function scrollToStep(key: string) {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      steps.current[key]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }

  useEffect(() => {
    listStates()
      .then(setStates)
      .catch(() => undefined);
  }, []);

  function onStateChange(id: string) {
    setStateId(id);
    setLgaId('');
    setLgas([]);
    setAnswers({});
    setError(undefined);
    if (!id) return;
    setLgaLoading(true);
    listLgas(id)
      .then(setLgas)
      .catch(() => undefined)
      .finally(() => setLgaLoading(false));
    scrollToStep('lga');
  }

  function onLgaChange(id: string) {
    setLgaId(id);
    if (id) scrollToStep('q0');
  }

  function onAnswer(index: number, key: QuestionKey, value: boolean) {
    const firstTime = answers[key] === undefined;
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (firstTime) {
      scrollToStep(index < RATING_QUESTIONS.length - 1 ? `q${index + 1}` : 'submit');
    }
  }

  const allAnswered = RATING_QUESTIONS.every((q) => answers[q.key] !== undefined);

  async function handleSubmit() {
    setSubmitting(true);
    setError(undefined);
    try {
      await submitRating({
        electionId: election.id,
        lgaId,
        noIntimidation: answers.noIntimidation!,
        accreditationProper: answers.accreditationProper!,
        votingOrderly: answers.votingOrderly!,
        securityPresent: answers.securityPresent!,
        witnessedMalpractice: answers.witnessedMalpractice!,
      });
      setConfirming(false);
      setDone(true);
    } catch (err) {
      setConfirming(false);
      setError(
        err instanceof ApiError ? err.message : 'Could not submit your rating. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime/20 text-[1.6rem] text-leaf" aria-hidden>
          ✓
        </span>
        <h2 className="mt-5 text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold tracking-[-0.02em]">
          Your rating is in
        </h2>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
          Thank you. Every rating rolls up into the public record for your LGA.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <a
            href="/results"
            className="flex h-12 items-center justify-center rounded-full bg-ink font-semibold text-cream transition hover:bg-lime hover:text-ink"
          >
            View results and ratings
          </a>
          <button type="button" onClick={onClose} className="h-12 font-semibold text-muted transition-colors hover:text-ink">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
        Rate the election
      </p>
      <h2 className="mt-2 text-[clamp(1.5rem,4vw,2rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
        How did voting go where you voted?
      </h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
        Five quick questions. Answer honestly - you can only rate once.
      </p>

      <div className="mt-7 space-y-5">
        <div>
          <SelectField
            label="State where you voted"
            value={stateId}
            onChange={onStateChange}
            options={states.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>

        {stateId ? (
          <div ref={(el) => { steps.current.lga = el; }}>
            <SelectField
              label={lgaLoading ? 'Loading LGAs…' : 'LGA where you voted'}
              value={lgaId}
              onChange={onLgaChange}
              disabled={lgaLoading}
              options={lgas.map((l) => ({ value: l.id, label: l.name }))}
            />
          </div>
        ) : null}

        {lgaId
          ? RATING_QUESTIONS.map((q, i) => {
              const visible = i === 0 || answers[RATING_QUESTIONS[i - 1].key] !== undefined;
              if (!visible) return null;
              return (
                <div
                  key={q.key}
                  ref={(el) => { steps.current[`q${i}`] = el; }}
                  className="rounded-2xl border border-ink/10 bg-cream/60 p-5"
                >
                  <p className="text-[1.02rem] font-semibold leading-snug">
                    <span className="mr-2 font-mono text-[0.8rem] text-leaf">{i + 1}/5</span>
                    {q.question}
                  </p>
                  <div className="mt-4">
                    <YesNo value={answers[q.key]} onChange={(v) => onAnswer(i, q.key, v)} />
                  </div>
                </div>
              );
            })
          : null}

        {allAnswered ? (
          <div ref={(el) => { steps.current.submit = el; }} className="pt-1">
            {error ? <p className="mb-3 font-mono text-[0.75rem] text-error">{error}</p> : null}
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex h-14 w-full items-center justify-center rounded-full bg-ink text-[1rem] font-semibold text-cream transition hover:bg-lime hover:text-ink"
            >
              Submit rating
            </button>
          </div>
        ) : null}
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-[360px] rounded-2xl bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,31,23,0.25)]">
            <h3 className="text-[1.2rem] font-extrabold tracking-[-0.01em]">Submit your rating?</h3>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
              You can rate this election only once, and it can’t be changed afterwards.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex h-12 items-center justify-center rounded-full bg-ink font-semibold text-cream transition hover:bg-lime hover:text-ink disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Yes, submit'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="h-12 font-semibold text-muted transition-colors hover:text-ink"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
