import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { env } from '../env';
import { logger } from '../logger';
import { buildOpenApiDocument } from './document';

/** True when interactive API docs should be exposed. Off in production unless explicitly enabled. */
export function docsEnabled(): boolean {
  return env.ENABLE_API_DOCS ? env.ENABLE_API_DOCS === 'true' : env.NODE_ENV !== 'production';
}

export function mountDocs(app: Express): void {
  if (!docsEnabled()) return;

  const document = buildOpenApiDocument();

  app.get('/docs.json', (_req, res) => {
    res.json(document);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: 'Fair Nigeria API',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  logger.info('API docs available at /docs');
}
