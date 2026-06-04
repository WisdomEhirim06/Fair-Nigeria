import type { RequestHandler } from 'express';

import { AppError } from '../errors';
import type { Role } from '../validation';

export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = req.user;
    if (!user) {
      next(new AppError('UNAUTHORIZED', 'Authentication required.'));
      return;
    }
    if (!allowed.includes(user.role)) {
      next(new AppError('FORBIDDEN', 'Your role is not permitted to perform this action.'));
      return;
    }
    next();
  };
}
