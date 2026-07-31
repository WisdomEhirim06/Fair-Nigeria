import { timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';
import { eq, and, isNull, gt, sql } from 'drizzle-orm';

import { authDb } from '../../db';
import { otpRecords, refreshTokens, users } from '../../db/auth/schema';
import { generateOpaqueToken, generateOtp, sha256Hex } from '../../shared/crypto';
import { AppError } from '../../shared/errors';
import { signAccessToken } from '../../shared/jwt';
import { logger } from '../../shared/logger';
import { getRedis } from '../../shared/redis';
import { sendOtpEmail } from '../email/email.service';
import type { RequestOtpInput, VerifyOtpInput } from './otp.schemas';

/** Redis key namespace for pending OTPs. */
const OTP_KEY = (phone: string) => `otp:${phone}`;

const OTP_TTL_SECONDS = 300; // 5 minutes
const REFRESH_TTL_DAYS = 7;
const MAX_OTP_ATTEMPTS = 5;

export async function requestOtp(input: RequestOtpInput): Promise<void> {
  const redis = getRedis();

  // Verify the phone belongs to a registered, active citizen before issuing an OTP.
  const [user] = await authDb
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.phoneNumber, input.phoneNumber), eq(users.isActive, true)))
    .limit(1);

  if (!user) {
    // Return success-shaped response so callers can't enumerate registered phones.
    logger.info({ phoneNumber: input.phoneNumber }, 'OTP requested');
    return;
  }

  const code = generateOtp();
  const codeHash = sha256Hex(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  // Store hash in Redis for fast lookup during verify. The DB record is the
  // audit trail; Redis is the live gate.
  await redis.set(OTP_KEY(input.phoneNumber), codeHash, 'EX', OTP_TTL_SECONDS);

  await authDb.insert(otpRecords).values({
    phoneNumber: input.phoneNumber,
    codeHash,
    expiresAt,
  });

  await sendOtpEmail(user.email, code);
}

// OTP verify + token

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function verifyOtpAndIssueTokens(input: VerifyOtpInput): Promise<TokenPair> {
  const redis = getRedis();

  // Redis fast path
  const storedHash = await redis.get(OTP_KEY(input.phoneNumber));
  if (!storedHash) {
    throw new AppError('UNAUTHORIZED', 'OTP has expired or was never issued.');
  }

  // Constant-time comparison (sha256Hex both sides so lengths always match)
  const incomingHash = sha256Hex(input.code);
  const hashesMatch = timingSafeEqual(incomingHash, storedHash);

  // Fetch the matching unused DB record (for audit + replay prevention)
  const now = new Date();
  const [record] = await authDb
    .select()
    .from(otpRecords)
    .where(
      and(
        eq(otpRecords.phoneNumber, input.phoneNumber),
        eq(otpRecords.codeHash, storedHash),
        isNull(otpRecords.usedAt),
        gt(otpRecords.expiresAt, now),
      ),
    )
    .limit(1);

  if (!record) {
    throw new AppError('UNAUTHORIZED', 'OTP has expired or was already used.');
  }

  // Atomically increment the attempt counter in the database and read back the
  // new value. Doing the increment in SQL (rather than record.attempts + 1 in JS)
  // is race-safe: concurrent verify requests can't both read the same old value
  
  const [updated] = await authDb
    .update(otpRecords)
    .set({ attempts: sql`${otpRecords.attempts} + 1` })
    .where(eq(otpRecords.id, record.id))
    .returning({ attempts: otpRecords.attempts });

  const attempts = updated?.attempts ?? record.attempts + 1;

  if (attempts > MAX_OTP_ATTEMPTS) {
    // Invalidate Redis key to force a fresh OTP request.
    await redis.del(OTP_KEY(input.phoneNumber));
    throw new AppError('UNAUTHORIZED', 'Too many incorrect attempts. Please request a new OTP.');
  }

  if (!hashesMatch) {
    throw new AppError('UNAUTHORIZED', 'Incorrect OTP.');
  }

  // Mark the record as used and delete the Redis key atomically.
  await Promise.all([
    authDb.update(otpRecords).set({ usedAt: now }).where(eq(otpRecords.id, record.id)),
    redis.del(OTP_KEY(input.phoneNumber)),
  ]);

  // Fetch the user (guaranteed active because requestOtp checked isActive).
  const [user] = await authDb
    .select()
    .from(users)
    .where(eq(users.phoneNumber, input.phoneNumber))
    .limit(1);

  if (!user || !user.isActive) {
    throw new AppError('UNAUTHORIZED', 'Account is inactive.');
  }

  return issueTokenPair(user.id, user.role);
}


export async function rotateRefreshToken(rawToken: string): Promise<TokenPair> {
  const tokenHash = sha256Hex(rawToken);
  const now = new Date();

  return authDb.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!record) {
      throw new AppError('UNAUTHORIZED', 'Refresh token is invalid, expired, or already used.');
    }

    // Revoke the old token immediately before issuing a new one.
    await tx
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, record.id));

    const [user] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, record.userId), eq(users.isActive, true)))
      .limit(1);

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Account not found or inactive.');
    }

    return issueTokenPair(user.id, user.role, tx);
  });
}

/**
 * Revoke a specific refresh token (logout). A missing or already-revoked token
 * is silently ignored so logout is idempotent.
 */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = sha256Hex(rawToken);
  const now = new Date();

  await authDb
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)));
}



async function issueTokenPair(
  userId: string,
  role: string,
  db: Pick<typeof authDb, 'insert'> = authDb,
): Promise<TokenPair> {
  const accessToken = await signAccessToken({
    sub: userId,
    role: role as import('../../shared/validation').Role,
  });

  const rawRefresh = generateOpaqueToken(32);
  const tokenHash = sha256Hex(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });

  return {
    accessToken,
    refreshToken: rawRefresh,
    expiresIn: 7200,
  };
}

/** Constant-time string comparison to prevent timing side-channels. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return cryptoTimingSafeEqual(bufA, bufB);
}
