import type { RequestHandler } from 'express';
import { AppError } from '../errors';

/** Catch-all for unmatched routes; forwards a 404 to the error handler. */
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError('NOT_FOUND', 'The requested resource was not found.'));
};
