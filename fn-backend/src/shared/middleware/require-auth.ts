import type { RequestHandler } from 'express';

import { AppError } from '../errors';
import { verifyAccessToken } from '../jwt';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('UNAUTHORIZED', 'Missing or malformed Authorization header.'));
    return;
  }

  const token = header.slice('Bearer '.length);
  verifyAccessToken(token)
    .then((payload) => {
      req.user = { id: payload.sub, role: payload.role };
      next();
    })
    .catch(() => {
      next(new AppError('UNAUTHORIZED', 'Invalid or expired access token.'));
    });
};
