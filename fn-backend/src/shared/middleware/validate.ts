import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

import { AppError } from '../errors';

type Source = 'body' | 'query' | 'params';


export function validate(schema: ZodSchema, source: Source = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      next(
        new AppError(
          'VALIDATION_ERROR',
          first?.message ?? 'Invalid request payload.',
          first?.path.join('.') || undefined,
        ),
      );
      return;
    }
    Object.assign(req[source] as Record<string, unknown>, result.data);
    next();
  };
}
