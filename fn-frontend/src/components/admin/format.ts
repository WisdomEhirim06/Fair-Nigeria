import type { ElectionStatus, InviteCode, Role } from '@/lib/api';

type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export function electionStatusTone(status: ElectionStatus): Tone {
  switch (status) {
    case 'active':
      return 'positive';
    case 'upcoming':
      return 'warning';
    case 'concluded':
      return 'neutral';
  }
}

/** Effective state of an invite code: revoked, expired, used up, or active. */
export function inviteState(code: InviteCode, now = Date.now()): {
  label: string;
  tone: Tone;
  usable: boolean;
} {
  if (!code.isActive) return { label: 'Revoked', tone: 'danger', usable: false };
  if (new Date(code.expiresAt).getTime() <= now) return { label: 'Expired', tone: 'neutral', usable: false };
  if (code.usedCount >= code.maxUses) return { label: 'Used up', tone: 'neutral', usable: false };
  return { label: 'Active', tone: 'positive', usable: true };
}

const ROLE_LABELS: Record<Role, string> = {
  citizen: 'Citizen',
  yiaga_official: 'Field officer',
  yiaga_transcriber: 'Transcriber',
  super_admin: 'Administrator',
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
