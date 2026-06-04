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
    });
    client.on('error', (err) => logger.error({ err }, 'Redis client error'));
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
