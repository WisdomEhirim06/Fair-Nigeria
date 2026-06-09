import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { validate } from '../../shared/middleware/validate';
import {
  getMeHandler,
  logoutHandler,
  refreshHandler,
  register,
  requestOtpHandler,
  verifyOtpHandler,
} from './auth.controller';
import { registerBodySchema } from './auth.schemas';
import { refreshBodySchema, requestOtpBodySchema, verifyOtpBodySchema } from './otp.schemas';


export const authRouter = Router();

//Registration
authRouter.post('/register', validate(registerBodySchema), register);

// OTP generation
authRouter.post('/request-otp', validate(requestOtpBodySchema), requestOtpHandler);

// OTP verify tokens, refresh rotation, logout
authRouter.post('/verify-otp', validate(verifyOtpBodySchema), verifyOtpHandler);
authRouter.post('/refresh', validate(refreshBodySchema), refreshHandler);
authRouter.post('/logout', validate(refreshBodySchema), logoutHandler);

// Authenticated profile — requires a valid Bearer token
authRouter.get('/me', requireAuth, getMeHandler);

/**
 * User management (Sprint 2, Super Admin only): provision officials/transcribers,
 * list/view users, toggle active status, update FCM tokens.
 * Base path: /api/v1/users
 */
export const usersRouter = Router();
