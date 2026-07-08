import { rateLimit, ipKeyGenerator, type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import { env } from '../env';
import { AppError } from '../errors';
import { getRedis } from '../redis';


function redisStore(prefix: string): RedisStore {
  return new RedisStore({
    prefix,
    // ioredis exposes `call` for raw commands, which is what rate-limit-redis needs.
    // It returns Promise<unknown>; the store expects Promise<number | string>.
    sendCommand: (...args: string[]) =>
      getRedis().call(args[0], ...args.slice(1)) as Promise<number | string>,
  });
}


const baseOptions: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Skip limiting in tests so they don't flake on shared counters.
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, _res, next) => {
    next(new AppError('RATE_LIMITED', 'Too many requests. Please slow down and try again later.'));
  },
};


export const globalRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
  limit: env.RATE_LIMIT_GLOBAL_MAX,
  store: redisStore('rl:global:'),
});

// Flag limiter: caps sheet flags per IP per window (guests included).
export const flagRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_FLAG_WINDOW_MS,
  limit: env.RATE_LIMIT_FLAG_MAX,
  store: redisStore('rl:flag:'),
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
});

// OTP limiter: caps OTP requests per phone number per hour

export const otpRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_OTP_WINDOW_MS,
  limit: env.RATE_LIMIT_OTP_MAX,
  store: redisStore('rl:otp:'),
  keyGenerator: (req) => {
    const phone = typeof req.body?.phoneNumber === 'string' ? req.body.phoneNumber.trim() : '';
    return phone || ipKeyGenerator(req.ip ?? '');
  },
});
