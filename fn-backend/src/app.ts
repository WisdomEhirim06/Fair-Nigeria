import express, { type Express } from 'express';
import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger';
import { successEnvelope } from './shared/response';
import { errorHandler } from './shared/middleware/error-handler';
import { notFound } from './shared/middleware/not-found';
import { mountDocs } from './shared/openapi';
import { apiRouter } from './routes';


export function createApp(): Express {
  const app = express();

  // Request logging with a generated request id, echoed back in a header so it
  // can be correlated with the `requestId` field in every response envelope.
  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    const requestId = req.id as unknown as string;
    res.json(successEnvelope({ status: 'ok', uptime: process.uptime() }, requestId));
  });

  mountDocs(app);

  app.use('/api/v1', apiRouter);

  // 404 then terminal error handler (must be registered last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
