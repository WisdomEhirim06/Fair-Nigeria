import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import type { Actor } from './elections.parties.service';
import { createParty, deleteParty, listParties, updateParty } from './elections.parties.service';
import type {
  CreatePartyInput,
  PartyParams,
  UpdatePartyInput,
} from './elections.parties.schemas';
import type { IdParam } from './elections.schemas';

function actorFrom(req: Parameters<RequestHandler>[0]): Actor {
  return { id: req.user!.id, role: req.user!.role, ip: req.ip ?? null };
}

function reqId(req: Parameters<RequestHandler>[0]): string {
  return req.id as unknown as string;
}

// GET /elections/:id/parties
export const listPartiesHandler: RequestHandler = async (req, res, next) => {
  try {
    const parties = await listParties((req.params as IdParam).id);
    res.json(successEnvelope(parties, reqId(req)));
  } catch (err) {
    next(err);
  }
};

// POST /elections/:id/parties (super admin)
export const createPartyHandler: RequestHandler = async (req, res, next) => {
  try {
    const party = await createParty(
      (req.params as IdParam).id,
      req.body as CreatePartyInput,
      actorFrom(req),
    );
    res.status(201).json(successEnvelope(party, reqId(req)));
  } catch (err) {
    next(err);
  }
};

// PATCH /elections/:id/parties/:partyId (super admin)
export const updatePartyHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id, partyId } = req.params as PartyParams;
    const party = await updateParty(id, partyId, req.body as UpdatePartyInput, actorFrom(req));
    res.json(successEnvelope(party, reqId(req)));
  } catch (err) {
    next(err);
  }
};

// DELETE /elections/:id/parties/:partyId (super admin)
export const deletePartyHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id, partyId } = req.params as PartyParams;
    await deleteParty(id, partyId, actorFrom(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
