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

/**
 * Wordlist for generating human-shareable invite codewords. 64 short, unambiguous
 * lowercase words → 6 bits of entropy each.
 */
const INVITE_WORDS = [
  'amber', 'anchor', 'apple', 'arrow', 'autumn', 'badge', 'basil', 'beacon',
  'birch', 'bison', 'bloom', 'bramble', 'breeze', 'cabin', 'cactus', 'canyon',
  'cedar', 'cherry', 'cobalt', 'comet', 'copper', 'coral', 'cosmic', 'cotton',
  'crane', 'crest', 'delta', 'dune', 'eagle', 'ember', 'falcon', 'fern',
  'flint', 'forest', 'garnet', 'glacier', 'grove', 'harbor', 'harvest', 'hazel',
  'heron', 'indigo', 'island', 'jasper', 'kestrel', 'lagoon', 'lantern', 'lily',
  'lion', 'lotus', 'meadow', 'mesa', 'olive', 'orchid', 'otter', 'pebble',
  'quartz', 'raven', 'ridge', 'river', 'saffron', 'sparrow', 'tundra', 'willow',
] as const;

/** Suffix alphabet — lowercase, no ambiguous chars (no l, o, 0, 1). */
const SUFFIX_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

/**
 * Normalize a codeword for hashing/lookup: trim, collapse internal whitespace to a
 * single space, lowercase. Ensures human typing variance ("Fair  Lion" vs "fair lion")
 * resolves to the same hash.
 */
export function normalizeInviteCode(code: string): string {
  return code.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Generate a fresh codeword: 4 random words + a 6-char random suffix, e.g.
 * "lion harvest anchor delta k7m2pq". ~24 bits (words) + ~30 bits (suffix) ≈ 54 bits.
 * Combined with maxUses caps, expiry, revocation, and registration rate limiting,
 * this is well beyond brute-forceable.
 */
export function generateInviteCode(): string {
  const words = Array.from(
    { length: 4 },
    () => INVITE_WORDS[randomInt(0, INVITE_WORDS.length)],
  );
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += SUFFIX_ALPHABET[randomInt(0, SUFFIX_ALPHABET.length)];
  }
  return `${words.join(' ')} ${suffix}`;
}
