import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import { listLgasByState, listStates } from './geography.service';
import type { StateIdParam } from './geography.schemas';

/** GET /geography/states — all states. Public. */
export const listStatesHandler: RequestHandler = async (req, res, next) => {
  try {
    const states = await listStates();
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(states, requestId));
  } catch (err) {
    next(err);
  }
};

/** GET /geography/states/:stateId/lgas — LGAs within a state. Public. */
export const listLgasHandler: RequestHandler = async (req, res, next) => {
  try {
    const lgas = await listLgasByState((req.params as StateIdParam).stateId);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(lgas, requestId));
  } catch (err) {
    next(err);
  }
};
