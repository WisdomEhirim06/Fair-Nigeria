import type { RequestHandler } from 'express';

import { logger } from '../../shared/logger';
import { successEnvelope } from '../../shared/response';
import type { RegisterInput } from './auth.schemas';
import { getUserById, registerUser, toPublicUser } from './auth.service';
import type { RefreshInput, RequestOtpInput, VerifyOtpInput } from './otp.schemas';
import {
  requestOtp,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyOtpAndIssueTokens,
} from './otp.service';


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
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(tokens, requestId));
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh
export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const tokens = await rotateRefreshToken((req.body as RefreshInput).refreshToken);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(tokens, requestId));
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

// POST /auth/logout
export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    await revokeRefreshToken((req.body as RefreshInput).refreshToken);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope({ message: 'Logged out.' }, requestId));
  } catch (err) {
    next(err);
  }
};
