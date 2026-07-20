'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  ApiError,
  changeElectionStatus,
  createParty,
  deleteParty,
  getElection,
  listParties,
  updateParty,
  type Election,
  type ElectionStatus,
  type Party,
  type PartyInput,
} from '@/lib/api';
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

// The single forward step available from each status.
const NEXT_STEP: Partial<Record<ElectionStatus, { to: ElectionStatus; label: string; warn: string }>> = {
  upcoming: {
    to: 'active',
    label: 'Open election',
    warn: 'This opens uploads and ratings and locks the party list. Parties can’t be added or changed once the election is active.',
  },
  active: {
    to: 'concluded',
    label: 'Conclude election',
    warn: 'This marks the election concluded. The count stays visible and citizens can still rate.',
  },
};

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null | undefined>(undefined);
  const [parties, setParties] = useState<Party[]>([]);

  const load = useCallback(async () => {
    const [e, p] = await Promise.all([
      getElection(id).catch(() => null),
      listParties(id).catch(() => []),
    ]);
    setElection(e);
    setParties(p);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (election === undefined) return <Spinner />;
  if (election === null) {
    return (
      <EmptyState
        title="Election not found"
        action={
          <a href="/admin/elections" className={btnPrimary}>
            Back to elections
          </a>
        }
      />
    );
  }

  const editable = election.status === 'upcoming';

  return (
    <div>
      <a href="/admin/elections" className="mb-5 inline-flex text-[0.85rem] font-medium text-muted transition-colors hover:text-ink">
        Elections
      </a>
      <PageHeading
        title={election.name}
        description={`${election.type} · ${formatDate(election.electionDate)}`}
        action={<Badge tone={electionStatusTone(election.status)}>{election.status}</Badge>}
      />

      <StatusControl election={election} onChanged={setElection} />

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.1rem] font-bold tracking-[-0.01em]">
            Parties <span className="font-mono text-[0.85rem] font-medium text-muted">({parties.length})</span>
          </h2>
          {editable ? (
            <AddPartyButton electionId={id} onAdded={(p) => setParties((prev) => [...prev, p])} />
          ) : null}
        </div>

        {!editable ? (
          <p className="mb-3 rounded-xl bg-gold/10 px-4 py-2.5 text-[0.82rem] font-medium text-ink/75">
            Parties are locked, they can only be changed while the election is upcoming.
          </p>
        ) : null}

        {parties.length === 0 ? (
          <EmptyState
            title="No parties yet"
            body={editable ? 'Add the parties contesting this election. Transcribers enter a vote count for each.' : undefined}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {parties.map((p) => (
              <PartyRow
                key={p.id}
                electionId={id}
                party={p}
                editable={editable}
                onUpdated={(u) => setParties((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
                onDeleted={(pid) => setParties((prev) => prev.filter((x) => x.id !== pid))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusControl({
  election,
  onChanged,
}: {
  election: Election;
  onChanged: (e: Election) => void;
}) {
  const step = NEXT_STEP[election.status];
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!step) {
    return (
      <Card className="p-5">
        <p className="text-[0.88rem] text-muted">This election is concluded, its lifecycle is complete.</p>
      </Card>
    );
  }

  async function advance() {
    if (!step) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await changeElectionStatus(election.id, step.to);
      onChanged(updated);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="text-[0.88rem] font-semibold">Lifecycle</p>
        <p className="mt-0.5 text-[0.83rem] text-muted">
          Currently <span className="font-semibold text-ink">{election.status}</span>. Next: {step.label.toLowerCase()}.
        </p>
      </div>
      <button type="button" onClick={() => setConfirming(true)} className={btnPrimary}>
        {step.label}
      </button>

      {confirming ? (
        <Modal title={step.label} onClose={() => setConfirming(false)}>
          <p className="text-[0.9rem] leading-relaxed text-muted">{step.warn}</p>
          {error ? (
            <p className="mt-4 rounded-lg bg-error/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-error">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => void advance()} disabled={saving} className={btnPrimary}>
              {saving ? 'Working…' : `Yes, ${step.label.toLowerCase()}`}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={btnGhost}>
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}

function PartyRow({
  electionId,
  party,
  editable,
  onUpdated,
  onDeleted,
}: {
  electionId: string;
  party: Party;
  editable: boolean;
  onUpdated: (p: Party) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await deleteParty(electionId, party.id);
      onDeleted(party.id);
    } catch {
      setBusy(false);
      setRemoving(false);
    }
  }

  return (
    <Card className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-forest/10 px-2 font-mono text-[0.72rem] font-bold text-forest-deep">
          {party.abbreviation}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.92rem] font-semibold">{party.name}</p>
          {party.candidateName ? (
            <p className="truncate text-[0.8rem] text-muted">{party.candidateName}</p>
          ) : null}
        </div>
      </div>
      {editable ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-leaf transition-colors hover:bg-lime/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setRemoving(true)}
            className="rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-error/80 transition-colors hover:bg-error/10"
          >
            Remove
          </button>
        </div>
      ) : null}

      {editing ? (
        <PartyModal
          electionId={electionId}
          party={party}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            onUpdated(p);
            setEditing(false);
          }}
        />
      ) : null}

      {removing ? (
        <Modal title="Remove party" onClose={() => setRemoving(false)}>
          <p className="text-[0.9rem] leading-relaxed text-muted">
            Remove <span className="font-semibold text-ink">{party.abbreviation}</span> from this
            election?
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-error px-4 py-2.5 text-[0.85rem] font-semibold text-cream transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Removing…' : 'Remove'}
            </button>
            <button type="button" onClick={() => setRemoving(false)} className={btnGhost}>
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}

function AddPartyButton({
  electionId,
  onAdded,
}: {
  electionId: string;
  onAdded: (p: Party) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>
        + Add party
      </button>
      {open ? (
        <PartyModal
          electionId={electionId}
          onClose={() => setOpen(false)}
          onSaved={(p) => {
            onAdded(p);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function PartyModal({
  electionId,
  party,
  onClose,
  onSaved,
}: {
  electionId: string;
  party?: Party;
  onClose: () => void;
  onSaved: (p: Party) => void;
}) {
  const [name, setName] = useState(party?.name ?? '');
  const [abbreviation, setAbbreviation] = useState(party?.abbreviation ?? '');
  const [candidateName, setCandidateName] = useState(party?.candidateName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  const ready = name.trim().length >= 2 && abbreviation.trim().length >= 1;

  async function submit() {
    if (!ready) return;
    setSaving(true);
    setError(null);
    setField(null);
    const input: PartyInput = {
      name: name.trim(),
      abbreviation: abbreviation.trim(),
      candidateName: candidateName.trim() || undefined,
    };
    try {
      const saved = party
        ? await updateParty(electionId, party.id, input)
        : await createParty(electionId, input);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setField(err.field ?? null);
      } else {
        setError('Could not save the party. Try again.');
      }
      setSaving(false);
    }
  }

  return (
    <Modal title={party ? 'Edit party' : 'Add party'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Party name" error={field === 'name' ? error : null}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="All Progressives Congress" />
        </Field>
        <Field label="Abbreviation" error={field === 'abbreviation' ? error : null} hint="Unique per election, e.g. APC">
          <input className={inputClass} value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="APC" />
        </Field>
        <Field label="Candidate (optional)">
          <input className={inputClass} value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
        </Field>

        {error && !field ? (
          <p className="rounded-lg bg-error/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-error">{error}</p>
        ) : null}

        <div className="mt-1 flex gap-3">
          <button type="button" onClick={() => void submit()} disabled={!ready || saving} className={btnPrimary}>
            {saving ? 'Saving…' : party ? 'Save changes' : 'Add party'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
