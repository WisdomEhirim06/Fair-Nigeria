import { eq, and, gt, sql } from 'drizzle-orm';

import { appDb, authDb } from '../../db';
import { states } from '../../db/app/schema';
import { inviteCodes, users, type User } from '../../db/auth/schema';
import { normalizeInviteCode, sha256Hex } from '../../shared/crypto';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import type { PublicUser, RegisterInput } from './auth.schemas';


async function resolveState(name?: string): Promise<{ name: string; zone: string } | null> {
  if (!name) return null;
  const [row] = await appDb
    .select({ name: states.name, zone: states.zone })
    .from(states)
    .where(sql`lower(${states.name}) = lower(${name})`)
    .limit(1);
  if (!row) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Unknown state '${name}'. It must be one of Nigeria's 36 states or the FCT (e.g. 'Lagos').`,
      'state',
    );
  }
  return { name: row.name, zone: row.zone };
}

export async function getUserById(id: string): Promise<PublicUser> {
  const [user] = await authDb
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.isActive, true)))
    .limit(1);

  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Account not found or inactive.');
  }

  return toPublicUser(user);
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    role: user.role,
    state: user.state,
    geopoliticalZone: user.geopoliticalZone,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}


/**
 * Translate a Postgres unique-constraint violation on `users` into a typed 409.
 * Rethrows anything that isn't a recognized duplicate.
 */
function translateUserDuplicate(err: unknown): never {
  if (isUniqueViolation(err, 'users_nin_hash_unique')) {
    throw new AppError('DUPLICATE_NIN', 'This NIN is already registered.', 'ninHash');
  }
  if (isUniqueViolation(err, 'users_phone_number_unique')) {
    throw new AppError(
      'DUPLICATE_PHONE',
      'This phone number is already registered.',
      'phoneNumber',
    );
  }
  if (isUniqueViolation(err, 'users_email_unique')) {
    throw new AppError('DUPLICATE_EMAIL', 'This email is already registered.', 'email');
  }
  throw err;
}


export async function registerUser(input: RegisterInput): Promise<User> {
  if (input.inviteCode) {
    return registerWithInviteCode(input, input.inviteCode);
  }

  // Reject unknown states
  const resolved = await resolveState(input.state);

  try {
    const [row] = await authDb
      .insert(users)
      .values({
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        email: input.email,
        ninHash: input.ninHash,
        role: 'citizen',
        state: resolved?.name ?? null,
        geopoliticalZone: resolved?.zone ?? input.geopoliticalZone ?? null,
      })
      .returning();

    return row;
  } catch (err) {
    translateUserDuplicate(err);
  }
}


async function registerWithInviteCode(input: RegisterInput, rawCode: string): Promise<User> {
  const codeHash = sha256Hex(normalizeInviteCode(rawCode));
  const now = new Date();

  return authDb.transaction(async (tx) => {
    const [code] = await tx
      .update(inviteCodes)
      .set({ usedCount: sql`${inviteCodes.usedCount} + 1` })
      .where(
        and(
          eq(inviteCodes.codeHash, codeHash),
          eq(inviteCodes.isActive, true),
          gt(inviteCodes.expiresAt, now),
          sql`${inviteCodes.usedCount} < ${inviteCodes.maxUses}`,
        ),
      )
      .returning({
        role: inviteCodes.role,
        state: inviteCodes.state,
        geopoliticalZone: inviteCodes.geopoliticalZone,
      });

    if (!code) {
      throw new AppError(
        'INVALID_INVITE_CODE',
        'Invite code is invalid, expired, or fully used.',
        'inviteCode',
      );
    }

    try {
      const [row] = await tx
        .insert(users)
        .values({
          fullName: input.fullName,
          phoneNumber: input.phoneNumber,
          email: input.email,
          ninHash: input.ninHash,
          role: code.role,
          // Geographic assignment comes from the code, not the client.
          state: code.state,
          geopoliticalZone: code.geopoliticalZone,
        })
        .returning();

      return row;
    } catch (err) {
      translateUserDuplicate(err);
    }
  });
}
