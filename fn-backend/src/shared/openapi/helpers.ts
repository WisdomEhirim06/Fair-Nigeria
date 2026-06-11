import { z } from 'zod';

import { errorEnvelopeSchema, metaSchema } from './registry';

export function successEnvelopeSchema<T extends z.ZodTypeAny>(data: T): z.ZodTypeAny {
  return z.object({
    success: z.literal(true),
    data,
    meta: metaSchema,
  });
}

/** A 2xx JSON response carrying `data` inside the success envelope. */
export function jsonOk<T extends z.ZodTypeAny>(data: T, description: string) {
  return {
    description,
    content: { 'application/json': { schema: successEnvelopeSchema(data) } },
  };
}

/** A JSON error response referencing the shared ErrorEnvelope component. */
export function jsonError(description: string) {
  return {
    description,
    content: { 'application/json': { schema: errorEnvelopeSchema } },
  };
}

export function commonErrors() {
  return {
    400: jsonError('Validation failed.'),
    429: jsonError('Rate limit exceeded.'),
    500: jsonError('Unexpected server error.'),
  };
}

/** Error responses for endpoints behind `requireAuth`. */
export function authErrors() {
  return {
    401: jsonError('Missing, invalid, or expired access token.'),
    403: jsonError('Authenticated, but role is not permitted.'),
  };
}
