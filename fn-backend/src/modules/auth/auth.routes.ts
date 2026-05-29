import { Router } from 'express';

/**
 * Auth module (Sprint 2): citizen registration (NIN-hash dedup), OTP generation
 * and verification, JWT issuance/refresh, logout, and the authenticated profile.
 * Base path: /api/v1/auth
 */
export const authRouter = Router();

/**
 * User management (Sprint 2, Super Admin only): provision Yiaga officials and
 * transcribers, list/view users, activate/suspend, and update FCM tokens.
 * Base path: /api/v1/users
 */
export const usersRouter = Router();
