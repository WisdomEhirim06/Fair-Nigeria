// Public API surface

export { ApiError } from './client';
export {
  getMe,
  logout,
  refresh,
  registerCitizen,
  registerStaff,
  requestOtp,
  verifyOtp,
} from './auth';
export { listStates } from './geography';
export type { AccessSession, ApiUser, RegisterResult, Role, StateOption } from './types';
