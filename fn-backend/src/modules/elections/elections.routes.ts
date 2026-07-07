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
  createPartyHandler,
  deletePartyHandler,
  listPartiesHandler,
  updatePartyHandler,
} from './elections.parties.controller';
import {
  createPartyBodySchema,
  partyParamsSchema,
  updatePartyBodySchema,
} from './elections.parties.schemas';

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

// Parties: public list, super-admin writes (only while the election is upcoming).
electionsRouter.get('/:id/parties', validate(idParamSchema, 'params'), listPartiesHandler);
electionsRouter.post(
  '/:id/parties',
  requireAuth,
  requireRole('super_admin'),
  validate(idParamSchema, 'params'),
  validate(createPartyBodySchema),
  createPartyHandler,
);
electionsRouter.patch(
  '/:id/parties/:partyId',
  requireAuth,
  requireRole('super_admin'),
  validate(partyParamsSchema, 'params'),
  validate(updatePartyBodySchema),
  updatePartyHandler,
);
electionsRouter.delete(
  '/:id/parties/:partyId',
  requireAuth,
  requireRole('super_admin'),
  validate(partyParamsSchema, 'params'),
  deletePartyHandler,
);

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
