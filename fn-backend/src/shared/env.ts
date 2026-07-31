import { config } from 'dotenv';
import { z } from 'zod';

// Load .env into process.env before validation.
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CORS_ORIGINS: z.string().optional(),

  // Whether to serve the Swagger UI / OpenAPI spec. When unset, docs are served
  // outside production only.
  ENABLE_API_DOCS: z.enum(['true', 'false']).optional(),

  
  DATABASE_URL: z.string().url(),
  AUTH_DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url().optional(),

  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  R2_IMAGE_RESIZING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10_485_760),

  FCM_SERVICE_ACCOUNT_B64: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Fair Nigeria <onboarding@resend.dev>'),

  FLAG_THRESHOLD: z.coerce.number().int().positive().default(5),

  // Rate limiting
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_OTP_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_OTP_WINDOW_MS: z.coerce.number().int().positive().default(3_600_000),
  // Sheet flagging: guests/citizens may raise at most N flags per window per IP.
  RATE_LIMIT_FLAG_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_FLAG_WINDOW_MS: z.coerce.number().int().positive().default(3_600_000),

  // Number of proxy hops to trust for client IP resolution (Cloudflare → Railway).
  // Default to 0 (don't trust X-Forwarded-For) unless explicitly configured for a known proxy setup.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger depends on env, so fall back to console here.
  console.error(
    'Invalid environment variables:\n',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
