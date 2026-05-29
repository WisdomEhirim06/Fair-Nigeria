import { Router } from 'express';

/**
 * Geography module: lookup for Nigerian states and LGAs, seeded from
 * static reference data (37 states, 774 LGAs). operate at state/LGA level; result sheets carry
 * a typed free-text polling-unit code instead. Base path: /api/v1/geography
 */
export const geographyRouter = Router();
