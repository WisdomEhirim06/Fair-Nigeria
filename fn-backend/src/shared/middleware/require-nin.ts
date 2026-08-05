import type { RequestHandler } from 'express';

import { userHasNin } from '../../modules/auth/auth.service';
import { AppError } from '../errors';


export const requireNin: RequestHandler = async (req, _res, next) => {
  try {
    if (await userHasNin(req.user!.id)) {
      next();
      return;
    }
    next(
      new AppError(
        'NIN_REQUIRED',
        'Add your NIN before rating. It’s how we make sure each person rates once.',
        'ninHash',
      ),
    );
  } catch (err) {
    next(err);
  }
};
