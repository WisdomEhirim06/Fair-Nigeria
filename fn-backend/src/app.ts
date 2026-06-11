import express, { type Express } from 'express';
import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';
import { env } from './shared/env';
import { logger } from './shared/logger';
import { successEnvelope } from './shared/response';
import { errorHandler } from './shared/middleware/error-handler';
import { notFound } from './shared/middleware/not-found';
import { globalRateLimiter } from './shared/middleware/rate-limit';
import { mountDocs } from './shared/openapi';
import { apiRouter } from './routes';


export function createApp(): Express {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY_HOPS);

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
      
      customSuccessMessage: (req, res, responseTime) =>
        `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`,
      customErrorMessage: (req, res, _err) =>
        `${req.method} ${req.url} ${res.statusCode}`,
      // Colour the line by outcome: 5xx → error, 4xx → warn, else info.
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    const requestId = req.id as unknown as string;
    res.json(successEnvelope({ status: 'ok', uptime: process.uptime() }, requestId));
  });

  mountDocs(app);

  // Global per-IP rate limit guards the whole API (health + docs stay unlimited).
  app.use('/api/v1', globalRateLimiter, apiRouter);

  // 404 then terminal error handler (must be registered last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
