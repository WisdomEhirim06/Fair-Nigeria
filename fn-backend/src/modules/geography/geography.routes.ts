import { Router } from 'express';

import { validate } from '../../shared/middleware/validate';
import { listLgasHandler, listStatesHandler } from './geography.controller';
import { stateIdParamSchema } from './geography.schemas';

export const geographyRouter = Router();

geographyRouter.get('/states', listStatesHandler);
geographyRouter.get(
  '/states/:stateId/lgas',
  validate(stateIdParamSchema, 'params'),
  listLgasHandler,
);
