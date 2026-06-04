import type { Role } from '../shared/validation';

/**
 * Augments Express's Request with the authenticated user set by requireAuth.
 * Kept optional because most middleware runs before authentication.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export {};
