import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Teach Zod the `.openapi()` method. Must run before any schema calls it, so this
// module is the single import point for the registry and is loaded first.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/** Bearer JWT auth, referenced by any endpoint guarded with `requireAuth`. */
export const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description:
    'RS256 access token (2h) issued on OTP verification. Send as `Authorization: Bearer <token>`.',
});

/** Mirrors `ResponseMeta` in shared/response.ts. */
export const metaSchema = registry.register(
  'ResponseMeta',
  z
    .object({
      timestamp: z.string().datetime(),
      requestId: z.string().uuid().optional(),
      pagination: z
        .object({
          page: z.number().int(),
          limit: z.number().int(),
          total: z.number().int(),
          hasNext: z.boolean(),
        })
        .optional(),
    })
    .openapi('ResponseMeta'),
);

/** Mirrors `ErrorEnvelope` in shared/response.ts. Referenced by every error response. */
export const errorEnvelopeSchema = registry.register(
  'ErrorEnvelope',
  z
    .object({
      success: z.literal(false),
      error: z.object({
        code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
        message: z.string().openapi({ example: 'Invalid request payload.' }),
        field: z.string().optional(),
      }),
      meta: metaSchema,
    })
    .openapi('ErrorEnvelope'),
);
