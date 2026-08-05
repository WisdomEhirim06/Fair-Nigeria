import type { RequestHandler } from 'express';

import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../../shared/cookies';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import { successEnvelope } from '../../shared/response';
import type { AddMyDetailsInput, RegisterInput } from './auth.schemas';
import { addMyDetails, getUserById, registerUser, toPublicUser } from './auth.service';
import type { RequestOtpInput, VerifyOtpInput } from './otp.schemas';
import {
  requestOtp,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyOtpAndIssueTokens,
} from './otp.service';

// Read the refresh token from its httpOnly cookie
function refreshTokenFrom(req: Parameters<RequestHandler>[0]): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[REFRESH_COOKIE_NAME];
}


export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await registerUser(req.body as RegisterInput);

    let otpSent = true;
    try {
      await requestOtp({ phoneNumber: user.phoneNumber });
    } catch (otpErr) {
      otpSent = false;
      logger.error({ err: otpErr }, 'OTP dispatch after registration failed');
    }

    const requestId = req.id as unknown as string;
    res.status(201).json(successEnvelope({ user: toPublicUser(user), otpSent }, requestId));
  } catch (err) {
    next(err);
  }
};

// POST /auth/request-otp
export const requestOtpHandler: RequestHandler = async (req, res, next) => {
  try {
    await requestOtp(req.body as RequestOtpInput);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope({ message: 'If this number is registered, an OTP has been sent.' }, requestId));
  } catch (err) {
    next(err);
  }
};

// POST /auth/verify-otp
export const verifyOtpHandler: RequestHandler = async (req, res, next) => {
  try {
    const tokens = await verifyOtpAndIssueTokens(req.body as VerifyOtpInput);
    setRefreshCookie(res, tokens.refreshToken);
    const requestId = req.id as unknown as string;
    res.json(
      successEnvelope({ accessToken: tokens.accessToken, expiresIn: tokens.expiresIn }, requestId),
    );
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh — rotate the refresh cookie, return a fresh access token.
export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const current = refreshTokenFrom(req);
    if (!current) {
      throw new AppError('UNAUTHORIZED', 'No refresh token.');
    }
    const tokens = await rotateRefreshToken(current);
    setRefreshCookie(res, tokens.refreshToken);
    const requestId = req.id as unknown as string;
    res.json(
      successEnvelope({ accessToken: tokens.accessToken, expiresIn: tokens.expiresIn }, requestId),
    );
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
export const getMeHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = await getUserById(req.user!.id);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(user, requestId));
  } catch (err) {
    next(err);
  }
};

// PATCH /auth/me/details — fill in a detail left blank at registration.
export const addMyDetailsHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = await addMyDetails(req.user!.id, req.body as AddMyDetailsInput);
    res.json(successEnvelope(user, req.id as unknown as string));
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout — revoke the refresh token from the cookie and clear it.
export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    const current = refreshTokenFrom(req);
    if (current) {
      await revokeRefreshToken(current);
    }
    clearRefreshCookie(res);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope({ message: 'Logged out.' }, requestId));
  } catch (err) {
    next(err);
  }
};
