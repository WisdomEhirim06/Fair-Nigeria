import { createHash, randomBytes, randomInt } from 'node:crypto';

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** A 6-digit one-time password*/
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
