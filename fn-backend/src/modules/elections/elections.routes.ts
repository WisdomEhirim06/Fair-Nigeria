import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import {
  changeElectionStatusHandler,
  createElectionHandler,
  getElectionHandler,
  listElectionsHandler,
} from './elections.controller';

import {
  createElectionBodySchema,
  idParamSchema,
  listElectionsQuerySchema,
  updateElectionStatusBodySchema,
} from './elections.schemas';


export const electionsRouter = Router();

// Public reads.
electionsRouter.get('/', validate(listElectionsQuerySchema, 'query'), listElectionsHandler);
electionsRouter.get('/:id', validate(idParamSchema, 'params'), getElectionHandler);

// Super-admin writes.
electionsRouter.post(
  '/',
  requireAuth,
  requireRole('super_admin'),
  validate(createElectionBodySchema),
  createElectionHandler,
);
electionsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('super_admin'),
  validate(idParamSchema, 'params'),
  validate(updateElectionStatusBodySchema),
  changeElectionStatusHandler,
);
