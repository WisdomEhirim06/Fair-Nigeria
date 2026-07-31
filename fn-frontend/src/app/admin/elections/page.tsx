'use client';

import { useEffect, useState } from 'react';

import { ApiError, createElection, listElections, type Election } from '@/lib/api';
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeading,
  Spinner,
  btnGhost,
  btnPrimary,
  inputClass,
} from '@/components/admin/ui';
import { electionStatusTone, formatDate } from '@/components/admin/format';

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void listElections()
      .then(setElections)
      .catch(() => setElections([]));
  }, []);

  return (
    <div>
      <PageHeading
        eyebrow="Configuration"
        title="Elections"
        description="Create an election, set up its parties while it's upcoming, then move it through its lifecycle."
        action={
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            + New election
          </button>
        }
      />

      {elections === null ? (
        <Spinner />
      ) : elections.length === 0 ? (
        <EmptyState
          title="No elections yet"
          body="Create the first election to open the whole pipeline — uploads, transcription, ratings and results."
          action={
            <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
              Create an election
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {elections.map((e) => (
            <a key={e.id} href={`/admin/elections/${e.id}`} className="group block">
              <Card className="p-5 transition-colors group-hover:border-lime/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-[1.1rem] font-bold tracking-[-0.01em]">{e.name}</h2>
                    <p className="mt-1 text-[0.83rem] text-muted">
                      {e.type} · {formatDate(e.electionDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={electionStatusTone(e.status)}>{e.status}</Badge>
                    <span className="text-ink/30 transition-colors group-hover:text-lime" aria-hidden>
                      →
                    </span>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      {creating ? (
        <CreateElectionModal
          onClose={() => setCreating(false)}
          onCreated={(el) => {
            setElections((prev) => [el, ...(prev ?? [])]);
            setCreating(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CreateElectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (e: Election) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Presidential');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  const ready = name.trim().length >= 3 && type.trim().length >= 3 && date !== '';

  async function submit() {
    if (!ready) return;
    setSaving(true);
    setError(null);
    setField(null);
    try {
      // The date input is a calendar day; send it as an ISO timestamp at midnight.
      const electionDate = new Date(`${date}T00:00:00`).toISOString();
      const created = await createElection({ name: name.trim(), type: type.trim(), electionDate });
      onCreated(created);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setField(err.field ?? null);
      } else {
        setError('Could not create the election. Try again.');
      }
      setSaving(false);
    }
  }

  return (
    <Modal title="New election" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Name" error={field === 'name' ? error : null}>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="2027 Presidential Election"
          />
        </Field>
        <Field label="Type" error={field === 'type' ? error : null}>
          <input className={inputClass} value={type} onChange={(e) => setType(e.target.value)} />
        </Field>
        <Field label="Polling date" error={field === 'electionDate' ? error : null}>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        {error && !field ? (
          <p className="rounded-lg bg-error/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-error">
            {error}
          </p>
        ) : null}

        <div className="mt-1 flex gap-3">
          <button type="button" onClick={() => void submit()} disabled={!ready || saving} className={btnPrimary}>
            {saving ? 'Creating…' : 'Create election'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
