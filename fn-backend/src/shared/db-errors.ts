/** Postgres SQLSTATE for a unique_violation. */
const UNIQUE_VIOLATION = '23505';

interface PostgresErrorShape {
  code?: string;
  constraint_name?: string;
}

/**
 * True when `err` is a Postgres unique-constraint violation. Pass `constraint` to
 * match a specific constraint by name (e.g. 'users_nin_hash_unique').
 *
 * Drizzle (with the postgres-js driver) wraps the raw driver error inside a
 * DrizzleQueryError. The actual Postgres fields (code, constraint_name) live on
 * the inner `.cause`, so we unwrap one level before inspecting.
 */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  // Unwrap DrizzleQueryError — the raw PostgresError sits on .cause
  const raw = (err as { cause?: unknown } | null)?.cause ?? err;
  const e = raw as PostgresErrorShape | null;
  if (!e || e.code !== UNIQUE_VIOLATION) return false;
  return constraint ? e.constraint_name === constraint : true;
}
