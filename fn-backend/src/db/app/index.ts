import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../../shared/env';
import * as schema from './schema';


const client = postgres(env.DATABASE_URL, {
  ssl: env.NODE_ENV === 'production' ? 'require' : false,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const appDb = drizzle(client, { schema });
export type AppDb = typeof appDb;
