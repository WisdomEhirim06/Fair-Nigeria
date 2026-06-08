import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { registry } from './registry';
// Side-effect import: registers all endpoint paths before the document is built.
import './paths';

type OpenApiDocument = ReturnType<OpenApiGeneratorV3['generateDocument']>;

let cached: OpenApiDocument | undefined;

/**
 * Build (and memoize) the OpenAPI 3.0 document from everything registered on the
 * shared registry. The server URL is `/` and paths are absolute (e.g.
 * `/api/v1/auth/register`) so both the root health check and the versioned API
 * are documented in one spec.
 */
export function buildOpenApiDocument(): OpenApiDocument {
  if (cached) return cached;

  const generator = new OpenApiGeneratorV3(registry.definitions);
  cached = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Fair Nigeria API',
      version: 'v1',
      description:
        'Citizen-led electoral transparency API. OTP-based auth (no passwords), ' +
        'client-side NIN hashing, append-only records, and a 2-of-3 transcription ' +
        'consensus engine.',
    },
    servers: [{ url: '/', description: 'Same origin' }],
    tags: [
      { name: 'System', description: 'Health and operational endpoints.' },
      { name: 'Auth', description: 'Registration, OTP login, JWT issuance and refresh.' },
      { name: 'Users', description: 'Super-admin user management.' },
    ],
  });

  return cached;
}
