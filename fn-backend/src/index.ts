import { createApp } from './app';
import { env } from './shared/env';
import { logger } from './shared/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Fair Nigeria backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  // Don't let a hung connection block shutdown forever.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
