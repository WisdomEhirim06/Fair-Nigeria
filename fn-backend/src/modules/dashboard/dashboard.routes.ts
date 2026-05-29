import { Router } from 'express';

/**
 * Dashboard module: public, read-only result and rating tallies served
 * exclusively from Redis pre-aggregates (Postgres is never queried on a dashboard
 * read). Aggregated LGA -> state -> national. Base path: /api/v1/dashboard
 */
export const dashboardRouter = Router();
