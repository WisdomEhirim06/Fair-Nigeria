import { eq, and } from 'drizzle-orm';

import { authDb } from '../../db';
import { users, type User } from '../../db/auth/schema';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import type { PublicUser, RegisterInput } from './auth.schemas';

/**
 * Fetch the profile of an active user by ID.
 * Used by GET /auth/me — never returns ninHash or fcmToken.
 * Throws UNAUTHORIZED (not NOT_FOUND) to avoid leaking whether an ID exists.
 */
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
    role: user.role,
    state: user.state,
    geopoliticalZone: user.geopoliticalZone,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}


// Deduplication is enforced by the UNIQUE constraints on nin_hash and phone_number
 
export async function registerCitizen(input: RegisterInput): Promise<User> {
  try {
    const [row] = await authDb
      .insert(users)
      .values({
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        ninHash: input.ninHash,
        role: 'citizen',
        state: input.state,
        geopoliticalZone: input.geopoliticalZone,
      })
      .returning();

    return row;
  } catch (err) {
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
    throw err;
  }
}
