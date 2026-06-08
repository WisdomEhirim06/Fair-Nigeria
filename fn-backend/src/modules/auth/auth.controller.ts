import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import type { RegisterInput } from './auth.schemas';
import { registerCitizen, toPublicUser } from './auth.service';
import type { RefreshInput, RequestOtpInput, VerifyOtpInput } from './otp.schemas';
import {
  requestOtp,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyOtpAndIssueTokens,
} from './otp.service';

/** POST /auth/register — create a citizen account from a client-side NIN hash. */
export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await registerCitizen(req.body as RegisterInput);
    const requestId = req.id as unknown as string;
    res.status(201).json(successEnvelope(toPublicUser(user), requestId));
  } catch (err) {
    next(err);
  }
};

/** POST /auth/request-otp — generate and SMS a 6-digit OTP to a registered phone. */
export const requestOtpHandler: RequestHandler = async (req, res, next) => {
  try {
    await requestOtp(req.body as RequestOtpInput);
    const requestId = req.id as unknown as string;
    // Always return 200 regardless of whether the phone is registered (prevents enumeration).
    res.json(successEnvelope({ message: 'If this number is registered, an OTP has been sent.' }, requestId));
  } catch (err) {
    next(err);
  }
};

/** POST /auth/verify-otp — verify OTP and exchange for access + refresh tokens. */
export const verifyOtpHandler: RequestHandler = async (req, res, next) => {
  try {
    const tokens = await verifyOtpAndIssueTokens(req.body as VerifyOtpInput);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(tokens, requestId));
  } catch (err) {
    next(err);
  }
};

/** POST /auth/refresh — rotate a refresh token and issue a new token pair. */
export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const tokens = await rotateRefreshToken((req.body as RefreshInput).refreshToken);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(tokens, requestId));
  } catch (err) {
    next(err);
  }
};

/** POST /auth/logout — revoke a refresh token. Idempotent. */
export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    await revokeRefreshToken((req.body as RefreshInput).refreshToken);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope({ message: 'Logged out.' }, requestId));
  } catch (err) {
    next(err);
  }
};
