import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { otpRateLimiter } from '../../shared/middleware/rate-limit';
import { validate } from '../../shared/middleware/validate';
import {
  addMyDetailsHandler,
  getMeHandler,
  logoutHandler,
  refreshHandler,
  register,
  requestOtpHandler,
  verifyOtpHandler,
} from './auth.controller';
import { addMyDetailsBodySchema, registerBodySchema } from './auth.schemas';
import { requestOtpBodySchema, verifyOtpBodySchema } from './otp.schemas';


export const authRouter = Router();

//Registration
authRouter.post('/register', validate(registerBodySchema), register);

// OTP generation — rate limited per phone number
authRouter.post('/request-otp', otpRateLimiter, validate(requestOtpBodySchema), requestOtpHandler);

// OTP verify issues tokens; refresh + logout use the httpOnly refresh cookie (no body).
authRouter.post('/verify-otp', validate(verifyOtpBodySchema), verifyOtpHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);

// Authenticated profile — requires a valid Bearer token
authRouter.get('/me', requireAuth, getMeHandler);

// Fill in a detail left blank at registration. Add-only: a field already set
// is rejected, so this is not a general profile editor.
authRouter.patch(
  '/me/details',
  requireAuth,
  validate(addMyDetailsBodySchema),
  addMyDetailsHandler,
);
