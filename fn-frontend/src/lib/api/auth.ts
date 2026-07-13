// Auth endpoints.

import { sha256Hex } from '../crypto';
import { attemptRefresh, request } from './client';
import { setAccessToken } from './session';
import type { AccessSession, ApiUser, RegisterResult } from './types';

/** Register a citizen. Returns { user, otpSent };*/
export async function registerCitizen(input: {
  fullName: string;
  phoneNumber: string;
  nin: string;
  state: string;
}): Promise<RegisterResult> {
  const ninHash = await sha256Hex(input.nin);
  return request<RegisterResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      ninHash,
      state: input.state,
    }),
  });
}

/** Register an official/transcriber. The invite code sets the role and state. */
export async function registerStaff(input: {
  fullName: string;
  phoneNumber: string;
  nin: string;
  inviteCode: string;
}): Promise<RegisterResult> {
  const ninHash = await sha256Hex(input.nin);
  return request<RegisterResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      ninHash,
      inviteCode: input.inviteCode,
    }),
  });
}

/** Send/resend OTP. Always resolves for registered and unregistered numbers. */
export async function requestOtp(phoneNumber: string): Promise<void> {
  await request<{ message: string }>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
}


export async function verifyOtp(phoneNumber: string, code: string): Promise<AccessSession> {
  const session = await request<AccessSession>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, code }),
  });
  setAccessToken(session.accessToken);
  return session;
}

// Restore a session on app load using the refresh cookie.
export async function refresh(): Promise<boolean> {
  return attemptRefresh();
}

export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}


export async function getMe(): Promise<ApiUser> {
  return request<ApiUser>('/auth/me', { method: 'GET' });
}
