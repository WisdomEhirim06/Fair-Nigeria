import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors';
import { errorEnvelope } from '../response';
import { logger } from '../logger';

function getRequestId(req: unknown): string | undefined {
  const id = (req as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
}

/**
 * Terminal error handler. Known AppErrors map to their declared status and code.
 * Anything else is logged and returned as a generic 500 so internals never leak.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = getRequestId(req);

  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(errorEnvelope({ code: err.code, message: err.message, field: err.field }, requestId));
    return;
  }

  logger.error({ err, requestId }, 'Unhandled error');
  res
    .status(500)
    .json(errorEnvelope({ code: 'INTERNAL_ERROR', message: 'Unexpected server error.' }, requestId));
};
