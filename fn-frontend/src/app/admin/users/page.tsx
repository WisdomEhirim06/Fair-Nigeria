'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ApiError,
  listUsers,
  updateUser,
  type ApiUser,
  type GeopoliticalZone,
  type Role,
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
import { roleLabel } from '@/components/admin/format';

const ROLES: Role[] = ['citizen', 'yiaga_official', 'yiaga_transcriber', 'super_admin'];
const ASSIGNABLE_ROLES: Role[] = ['citizen', 'yiaga_official', 'yiaga_transcriber'];
const ZONES: GeopoliticalZone[] = ['NW', 'NE', 'NC', 'SW', 'SE', 'SS'];

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<ApiUser | null>(null);

  const load = useCallback(async () => {
    setUsers(null);
    const rows = await listUsers({
      role: (roleFilter || undefined) as Role | undefined,
      isActive: statusFilter === '' ? undefined : statusFilter === 'active',
      limit: 100,
    }).catch(() => []);
    setUsers(rows);
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeading
        eyebrow="Access"
        title="Users"
        description="Everyone with an account. Change a role, or deactivate an account to revoke access."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`${selectClass} max-w-[200px]`}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectClass} max-w-[180px]`}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {users === null ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState title="No users match" body="Try clearing the filters." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {users.map((u) => (
            <Card key={u.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[0.92rem] font-semibold">{u.fullName}</span>
                  {!u.isActive ? <Badge tone="danger">Inactive</Badge> : null}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.72rem] text-muted">
                  <span>{u.phoneNumber}</span>
                  <span aria-hidden>·</span>
                  <span>{roleLabel(u.role)}</span>
                  {u.state ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{u.state}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(u)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-leaf transition-colors hover:bg-lime/10"
              >
                Edit
              </button>
            </Card>
          ))}
        </div>
      )}

      {editing ? (
        <EditUserModal
          user={editing}
          zones={ZONES}
          onClose={() => setEditing(null)}
          onSaved={(u) => {
            setUsers((prev) => (prev ?? []).map((x) => (x.id === u.id ? u : x)));
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EditUserModal({
  user,
  zones,
  onClose,
  onSaved,
}: {
  user: ApiUser;
  zones: GeopoliticalZone[];
  onClose: () => void;
  onSaved: (u: ApiUser) => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [state, setState] = useState(user.state ?? '');
  const [zone, setZone] = useState(user.geopoliticalZone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const patch: Parameters<typeof updateUser>[1] = { role, isActive };
      if (state.trim()) patch.state = state.trim();
      if (zone) patch.geopoliticalZone = zone as GeopoliticalZone;
      onSaved(await updateUser(user.id, patch));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <Modal title={user.fullName} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field
          label="Role"
          hint={user.role === 'super_admin' ? 'Administrator accounts can’t be reassigned here.' : undefined}
        >
          {user.role === 'super_admin' ? (
            <input className={inputClass} value={roleLabel('super_admin')} disabled readOnly />
          ) : (
            <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <label className="flex items-center justify-between rounded-xl border border-ink/15 bg-white px-4 py-3">
          <span>
            <span className="block text-[0.88rem] font-semibold">Active</span>
            <span className="block text-[0.78rem] text-muted">Inactive accounts can’t sign in.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-lime' : 'bg-ink/20'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field label="State (optional)">
            <input className={inputClass} value={state} onChange={(e) => setState(e.target.value)} />
          </Field>
          <Field label="Zone (optional)">
            <select className={selectClass} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">—</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error ? (
          <p className="rounded-lg bg-error/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-error">{error}</p>
        ) : null}

        <div className="mt-1 flex gap-3">
          <button type="button" onClick={() => void submit()} disabled={saving} className={btnPrimary}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
