import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import type { Actor } from './elections.service';
import {
  changeElectionStatus,
  createElection,
  getElection,
  listElections,
} from './elections.service';

import {
  listElectionsQuerySchema,
  type CreateElectionInput,
  type IdParam,
  type UpdateElectionStatusInput,
} from './elections.schemas';

/** Build the audit actor from the authenticated request. */
function actorFrom(req: Parameters<RequestHandler>[0]): Actor {
  return { id: req.user!.id, role: req.user!.role, ip: req.ip ?? null };
}

/** POST /elections — create an election (super admin). */
export const createElectionHandler: RequestHandler = async (req, res, next) => {
  try {
    const election = await createElection(req.body as CreateElectionInput, actorFrom(req));
    const requestId = req.id as unknown as string;
    res.status(201).json(successEnvelope(election, requestId));
  } catch (err) {
    next(err);
  }
};

/** GET /elections — list elections, optionally filtered by status. Public. */
export const listElectionsHandler: RequestHandler = async (req, res, next) => {
  try {
    // Re-parse: Express 5's req.query is a getter, so validate's coercion may not persist.
    const query = listElectionsQuerySchema.parse(req.query);
    const list = await listElections(query);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(list, requestId));
  } catch (err) {
    next(err);
  }
};

/** GET /elections/:id — single election. Public. */
export const getElectionHandler: RequestHandler = async (req, res, next) => {
  try {
    const election = await getElection((req.params as IdParam).id);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(election, requestId));
  } catch (err) {
    next(err);
  }
};

/** PATCH /elections/:id/status — advance election status (super admin). */
export const changeElectionStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const { status } = req.body as UpdateElectionStatusInput;
    const election = await changeElectionStatus((req.params as IdParam).id, status, actorFrom(req));
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(election, requestId));
  } catch (err) {
    next(err);
  }
};
