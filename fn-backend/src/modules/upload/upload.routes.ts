import { Router } from 'express';

import { optionalAuth } from '../../shared/middleware/optional-auth';
import { flagRateLimiter } from '../../shared/middleware/rate-limit';
import { requireAuth } from '../../shared/middleware/require-auth';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import {
  flagSheetHandler,
  getSheetHandler,
  getSheetResultHandler,
  listMyUploadsHandler,
  listSheetsHandler,
  uploadSheetHandler,
} from './upload.controller';
import { flagSheetBodySchema, sheetIdParamSchema } from './upload.schemas';

// /api/v1/upload — write side (Yiaga officials).
export const uploadRouter = Router();

// The officer's own uploads. Auth-scoped, since the public list hides uploaders.
uploadRouter.get('/mine', requireAuth, requireRole('yiaga_official'), listMyUploadsHandler);

// Multipart body is parsed by busboy in the handler, so no body validator here.
uploadRouter.post('/', requireAuth, requireRole('yiaga_official'), uploadSheetHandler);

// /api/v1/sheets — public read side + flagging.
export const sheetsRouter = Router();

sheetsRouter.get('/', listSheetsHandler);
sheetsRouter.get('/:id', validate(sheetIdParamSchema, 'params'), getSheetHandler);

// The figures published from this sheet — how a number traces back to paper.
sheetsRouter.get(
  '/:id/result',
  validate(sheetIdParamSchema, 'params'),
  getSheetResultHandler,
);

// Flagging is open to everyone (guests included); rate-limited per IP.
sheetsRouter.post(
  '/:id/flag',
  optionalAuth,
  flagRateLimiter,
  validate(sheetIdParamSchema, 'params'),
  validate(flagSheetBodySchema),
  flagSheetHandler,
);
