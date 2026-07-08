import { and, count, desc, eq, type SQL } from 'drizzle-orm';

import { authDb } from '../../db';
import { inviteCodes, users, type InviteCode } from '../../db/auth/schema';
import { generateInviteCode, normalizeInviteCode, sha256Hex } from '../../shared/crypto';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import { writeAuditSafe, type AuditActor } from '../audit/audit.service';
import type { PublicUser } from '../auth/auth.schemas';
import { toPublicUser } from '../auth/auth.service';
import type {
  CreateInviteCodeInput,
  ListUsersQuery,
  PublicInviteCode,
  UpdateUserInput,
} from './admin.schemas';

//  Invite codes

function toPublicInviteCode(row: InviteCode): PublicInviteCode {
  return {
    id: row.id,
    role: row.role,
    state: row.state,
    geopoliticalZone: row.geopoliticalZone,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    isActive: row.isActive,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export interface CreatedInviteCode {
  /** Plaintext codeword — returned ONCE at creation, never retrievable again. */
  code: string;
  inviteCode: PublicInviteCode;
}

export async function createInviteCode(
  input: CreateInviteCodeInput,
  actor: AuditActor,
): Promise<CreatedInviteCode> {
  const expiresAt = new Date(input.expiresAt);
  if (expiresAt.getTime() <= Date.now()) {
    throw new AppError('VALIDATION_ERROR', 'expiresAt must be in the future.', 'expiresAt');
  }

  // Use the admin-supplied phrase if given, otherwise generate one.
  const plaintext = input.code ?? generateInviteCode();
  const codeHash = sha256Hex(normalizeInviteCode(plaintext));

  try {
    const [row] = await authDb
      .insert(inviteCodes)
      .values({
        codeHash,
        role: input.role,
        state: input.state,
        geopoliticalZone: input.geopoliticalZone,
        maxUses: input.maxUses,
        expiresAt,
        createdBy: actor.id,
      })
      .returning();

    await writeAuditSafe({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'invite_code.create',
      entityType: 'invite_code',
      entityId: row.id,
      metadata: { role: row.role, state: row.state, maxUses: row.maxUses },
      ipAddress: actor.ip,
    });

    return { code: plaintext, inviteCode: toPublicInviteCode(row) };
  } catch (err) {
    if (isUniqueViolation(err, 'invite_codes_code_hash_unique')) {
      throw new AppError(
        'DUPLICATE_INVITE_CODE',
        'That codeword already exists. Choose a different phrase.',
        'code',
      );
    }
    throw err;
  }
}

export async function listInviteCodes(): Promise<PublicInviteCode[]> {
  const rows = await authDb
    .select()
    .from(inviteCodes)
    .orderBy(desc(inviteCodes.createdAt));
  return rows.map(toPublicInviteCode);
}

/** Revoke a code (set isActive = false). Idempotent; 404 if the id doesn't exist. */
export async function revokeInviteCode(id: string, actor: AuditActor): Promise<PublicInviteCode> {
  const [row] = await authDb
    .update(inviteCodes)
    .set({ isActive: false })
    .where(eq(inviteCodes.id, id))
    .returning();

  if (!row) {
    throw new AppError('NOT_FOUND', 'Invite code not found.');
  }

  await writeAuditSafe({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'invite_code.revoke',
    entityType: 'invite_code',
    entityId: row.id,
    ipAddress: actor.ip,
  });

  return toPublicInviteCode(row);
}

//  User management

export interface PaginatedUsers {
  users: PublicUser[];
  total: number;
}

export async function listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
  const conditions: SQL[] = [];
  if (query.role) conditions.push(eq(users.role, query.role));
  if (query.state) conditions.push(eq(users.state, query.state));
  if (query.isActive !== undefined) conditions.push(eq(users.isActive, query.isActive));

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (query.page - 1) * query.limit;

  const [rows, [{ total }]] = await Promise.all([
    authDb
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(offset),
    authDb.select({ total: count() }).from(users).where(where),
  ]);

  return { users: rows.map(toPublicUser), total };
}

/** Admin view of a single user — unlike /auth/me, returns inactive users and 404s on miss. */
export async function getUser(id: string): Promise<PublicUser> {
  const [user] = await authDb.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found.');
  }
  return toPublicUser(user);
}

export async function updateUser(
  id: string,
  patch: UpdateUserInput,
  actor: AuditActor,
): Promise<PublicUser> {
  const [row] = await authDb
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!row) {
    throw new AppError('NOT_FOUND', 'User not found.');
  }

  await writeAuditSafe({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'user.update',
    entityType: 'user',
    entityId: row.id,
    // Record which fields changed, not the values (avoid logging sensitive data).
    metadata: { fields: Object.keys(patch) },
    ipAddress: actor.ip,
  });

  return toPublicUser(row);
}
