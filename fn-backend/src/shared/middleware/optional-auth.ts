import type { RequestHandler } from 'express';

import { verifyAccessToken } from '../jwt';


export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  verifyAccessToken(header.slice('Bearer '.length))
    .then((payload) => {
      req.user = { id: payload.sub, role: payload.role };
    })
    .catch(() => undefined)
    .finally(() => next());
};
