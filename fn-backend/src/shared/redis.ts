import Redis from 'ioredis';

import { env } from './env';
import { logger } from './logger';


let client: Redis | undefined;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      // Back off reconnect attempts so a downed Redis doesn't spin the logs.
      retryStrategy: (times) => Math.min(times * 1000, 30_000),
    });

    // Log connection errors compactly, and only once per outage — ioredis fires
    // the 'error' event on every retry, which would otherwise flood the console.
    let errorLogged = false;
    client.on('error', (err: NodeJS.ErrnoException) => {
      if (!errorLogged) {
        logger.error(`Redis connection error: ${err.code ?? err.message}`);
        errorLogged = true;
      }
    });
    client.on('ready', () => {
      errorLogged = false;
      logger.info('Redis connected');
    });
  }
  return client;
}

/** Close the Redis connection cleanly during graceful shutdown. */
export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = undefined;
  }
}
