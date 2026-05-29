import { Router } from 'express';

/**
 * Elections module: create and list election cycles and manage status
 * transitions (upcoming -> active -> concluded). Super Admin writes only.
 * Base path: /api/v1/elections
 */
export const electionsRouter = Router();
