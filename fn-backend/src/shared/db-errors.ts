/** Postgres SQLSTATE for a unique_violation. */
const UNIQUE_VIOLATION = '23505';

interface PostgresErrorShape {
  code?: string;
  constraint_name?: string;
}

/**
 * True when `err` is a Postgres unique-constraint violation. Pass `constraint` to
 * match a specific constraint by name (e.g. 'users_nin_hash_unique').
 */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = err as PostgresErrorShape | null;
  if (!e || e.code !== UNIQUE_VIOLATION) return false;
  return constraint ? e.constraint_name === constraint : true;
}
