import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit configuration for the auth database (fn_auth).
 *
 * Commands (run from fn-backend/):
 *   npm run db:generate:auth  — generate a new migration from schema changes
 *   npm run db:migrate:auth   — apply pending migrations to fn_auth
 *   npm run db:studio:auth    — open Drizzle Studio for fn_auth
 */
export default defineConfig({
  schema: './src/db/auth/schema.ts',
  out: './src/db/auth/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['AUTH_DATABASE_URL']!,
  },
  verbose: true,
  strict: true,
});
