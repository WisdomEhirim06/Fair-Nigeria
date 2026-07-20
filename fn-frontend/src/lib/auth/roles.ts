// Single source of truth for role-based routing.
//
// Every authenticated area derives its home, guard, and nav from here so there
// is exactly one place to change when a role's landing page moves. Never
// hardcode a role's home path anywhere else — call homePathFor() instead.

import type { Role } from '@/lib/api';

/** Where each role goes after login, and where a wrong-role user is bounced to. */
export const ROLE_HOME: Record<Role, string> = {
  citizen: '/dashboard',
  yiaga_official: '/upload',
  yiaga_transcriber: '/transcribe',
  super_admin: '/admin',
};

/** Human label for a role — used in nav badges and headers. */
export const ROLE_LABELS: Record<Role, string> = {
  citizen: 'Citizen',
  yiaga_official: 'Field officer',
  yiaga_transcriber: 'Transcriber',
  super_admin: 'Administrator',
};

export function homePathFor(role: Role | null | undefined): string {
  return role ? ROLE_HOME[role] : '/dashboard';
}

export function roleLabel(role: Role | null | undefined): string {
  return role ? ROLE_LABELS[role] : '';
}

/** Icons the shell can draw for a nav destination. */
export type NavIcon = 'home' | 'upload' | 'transcribe' | 'admin' | 'results' | 'audit';

/** A nav destination shown inside the authenticated app shell. */
export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

/**
 * The links each role sees in the app shell. The role's own workspace comes
 * first and is always present, so there is never a dead end: wherever you are —
 * results, audit — one tap returns you to your work.
 */
export const ROLE_NAV: Record<Role, NavItem[]> = {
  citizen: [
    { href: '/dashboard', label: 'Home', icon: 'home' },
    { href: '/results', label: 'Results', icon: 'results' },
    { href: '/audit', label: 'Audit', icon: 'audit' },
  ],
  yiaga_official: [
    { href: '/upload', label: 'Upload', icon: 'upload' },
    { href: '/results', label: 'Results', icon: 'results' },
    { href: '/audit', label: 'Audit', icon: 'audit' },
  ],
  yiaga_transcriber: [
    { href: '/transcribe', label: 'Transcribe', icon: 'transcribe' },
    { href: '/results', label: 'Results', icon: 'results' },
    { href: '/audit', label: 'Audit', icon: 'audit' },
  ],
  super_admin: [
    { href: '/admin', label: 'Overview', icon: 'admin' },
    { href: '/results', label: 'Results', icon: 'results' },
    { href: '/audit', label: 'Audit', icon: 'audit' },
  ],
};

export function navFor(role: Role | null | undefined): NavItem[] {
  return role ? ROLE_NAV[role] : [];
}
