import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../../shared/env';
import * as schema from './schema';

// Drizzle client for the auth database (fn_auth).

const client = postgres(env.AUTH_DATABASE_URL, {
  ssl: env.NODE_ENV === 'production' ? 'require' : false,
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const authDb = drizzle(client, { schema });
export type AuthDb = typeof authDb;

/** Close the fn_auth connection pool during graceful shutdown. */
export const closeAuthDb = (): Promise<void> => client.end();
