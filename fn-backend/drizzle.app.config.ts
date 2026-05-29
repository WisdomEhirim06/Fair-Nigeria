import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit configuration for the main application database (fn_app).
 *
 * Commands (run from fn-backend/):
 *   npm run db:generate:app   — generate a new migration from schema changes
 *   npm run db:migrate:app    — apply pending migrations to fn_app
 *   npm run db:studio:app     — open Drizzle Studio for fn_app
 */
export default defineConfig({
  schema: './src/db/app/schema.ts',
  out: './src/db/app/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
  verbose: true,
  strict: true,
});
