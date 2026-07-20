'use client';

import { useEffect, useState } from 'react';

import {
  ApiError,
  createInviteCode,
  listInviteCodes,
  revokeInviteCode,
  type CreatedInviteCode,
  type GeopoliticalZone,
  type InviteCode,
  type ProvisionableRole,
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
  selectClass,
} from '@/components/admin/ui';
import { formatDate, inviteState, roleLabel } from '@/components/admin/format';

const ROLE_OPTIONS: { value: ProvisionableRole; label: string }[] = [
  { value: 'yiaga_official', label: 'Field officer' },
  { value: 'yiaga_transcriber', label: 'Transcriber' },
];

const ZONES: { value: GeopoliticalZone; label: string }[] = [
  { value: 'NW', label: 'North-West' },
  { value: 'NE', label: 'North-East' },
  { value: 'NC', label: 'North-Central' },
  { value: 'SW', label: 'South-West' },
  { value: 'SE', label: 'South-East' },
  { value: 'SS', label: 'South-South' },
];

export default function InvitesPage() {
  const [codes, setCodes] = useState<InviteCode[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void listInviteCodes()
      .then(setCodes)
      .catch(() => setCodes([]));
  }, []);

  return (
    <div>
      <PageHeading
        eyebrow="Access"
        title="Invite codes"
        description="Mint codewords that let field officers and transcribers register. The codeword is shown once, at creation."
        action={
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            + New code
          </button>
        }
      />

      {codes === null ? (
        <Spinner />
      ) : codes.length === 0 ? (
        <EmptyState
          title="No invite codes yet"
          body="Create a code to onboard your first field officer or transcriber."
          action={
            <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
              Create a code
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {codes.map((c) => (
            <InviteRow
              key={c.id}
              code={c}
              onRevoked={(u) => setCodes((prev) => (prev ?? []).map((x) => (x.id === u.id ? u : x)))}
            />
          ))}
        </div>
      )}

      {creating ? (
        <CreateInviteModal
          roleOptions={ROLE_OPTIONS}
          zones={ZONES}
          onClose={() => setCreating(false)}
          onCreated={(c) => setCodes((prev) => [c, ...(prev ?? [])])}
        />
      ) : null}
    </div>
  );
}

function InviteRow({
  code,
  onRevoked,
}: {
  code: InviteCode;
  onRevoked: (c: InviteCode) => void;
}) {
  const state = inviteState(code);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function revoke() {
    setBusy(true);
    try {
      onRevoked(await revokeInviteCode(code.id));
      setConfirming(false);
    } catch {
      setBusy(false);
    }
  }

  const scope = code.state ?? code.geopoliticalZone ?? 'Nationwide';

  return (
    <Card className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[0.92rem] font-semibold">{roleLabel(code.role)}</span>
          <Badge tone={state.tone}>{state.label}</Badge>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.72rem] text-muted">
          <span>{scope}</span>
          <span aria-hidden>·</span>
          <span>
            {code.usedCount}/{code.maxUses} used
          </span>
          <span aria-hidden>·</span>
          <span>expires {formatDate(code.expiresAt)}</span>
        </p>
      </div>
      {state.usable ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-error/80 transition-colors hover:bg-error/10"
        >
          Revoke
        </button>
      ) : null}

      {confirming ? (
        <Modal title="Revoke code" onClose={() => setConfirming(false)}>
          <p className="text-[0.9rem] leading-relaxed text-muted">
            Revoking stops this codeword from being used to register. Anyone already onboarded keeps
            their account.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => void revoke()}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-error px-4 py-2.5 text-[0.85rem] font-semibold text-cream transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Revoking…' : 'Revoke code'}
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

function CreateInviteModal({
  roleOptions,
  zones,
  onClose,
  onCreated,
}: {
  roleOptions: { value: ProvisionableRole; label: string }[];
  zones: { value: GeopoliticalZone; label: string }[];
  onClose: () => void;
  onCreated: (c: InviteCode) => void;
}) {
  const [role, setRole] = useState<ProvisionableRole>('yiaga_official');
  const [maxUses, setMaxUses] = useState('1');
  const [expires, setExpires] = useState('');
  const [zone, setZone] = useState('');
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  const [created, setCreated] = useState<CreatedInviteCode | null>(null);
  const [copied, setCopied] = useState(false);

  const ready = Number(maxUses) >= 1 && expires !== '' && (custom === '' || custom.trim().length >= 12);

  async function submit() {
    if (!ready) return;
    setSaving(true);
    setError(null);
    setField(null);
    try {
      const result = await createInviteCode({
        role,
        maxUses: Number(maxUses),
        expiresAt: new Date(`${expires}T23:59:59`).toISOString(),
        geopoliticalZone: (zone || undefined) as GeopoliticalZone | undefined,
        code: custom.trim() || undefined,
      });
      setCreated(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setField(err.field ?? null);
      } else {
        setError('Could not create the code. Try again.');
      }
      setSaving(false);
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the code is shown for manual copy */
    }
  }

  // Success view — the plaintext code, shown once.
  if (created) {
    return (
      <Modal
        title="Code created"
        onClose={() => {
          onCreated(created.inviteCode);
          onClose();
        }}
      >
        <p className="text-[0.9rem] leading-relaxed text-muted">
          Share this codeword with the {roleLabel(created.inviteCode.role).toLowerCase()}. It won’t
          be shown again — copy it now.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-lime/40 bg-lime/[0.08] px-4 py-3.5">
          <code className="break-all font-mono text-[1rem] font-bold text-forest-deep">
            {created.code}
          </code>
          <button
            type="button"
            onClick={() => void copy()}
            className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onCreated(created.inviteCode);
            onClose();
          }}
          className={`mt-6 w-full ${btnPrimary}`}
        >
          Done
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="New invite code" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Role">
          <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as ProvisionableRole)}>
            {roleOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Max uses" error={field === 'maxUses' ? error : null}>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </Field>
          <Field label="Expires" error={field === 'expiresAt' ? error : null}>
            <input type="date" className={inputClass} value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
        </div>

        <Field label="Zone (optional)" hint="Restrict the code to one geopolitical zone.">
          <select className={selectClass} value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">Nationwide</option>
            {zones.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Custom codeword (optional)"
          hint="At least 12 characters. Leave blank to auto-generate one."
          error={field === 'code' ? error : null}
        >
          <input className={inputClass} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. lagos-field-2027" />
        </Field>

        {error && !field ? (
          <p className="rounded-lg bg-error/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-error">{error}</p>
        ) : null}

        <div className="mt-1 flex gap-3">
          <button type="button" onClick={() => void submit()} disabled={!ready || saving} className={btnPrimary}>
            {saving ? 'Creating…' : 'Create code'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
