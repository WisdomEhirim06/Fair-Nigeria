import { createApp } from './app';
import { closeAppDb, closeAuthDb } from './db';
import { env } from './shared/env';
import { logger } from './shared/logger';
import { closeRedis } from './shared/redis';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Fair Nigeria backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    // Release external resources once HTTP traffic has drained.
    void Promise.allSettled([closeAppDb(), closeAuthDb(), closeRedis()]).then(() => {
      logger.info('Database and Redis connections closed.');
      process.exit(0);
    });
  });
  // Don't let a hung connection block shutdown forever.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
