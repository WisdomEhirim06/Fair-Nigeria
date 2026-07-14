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
export { listStates, listLgas } from './geography';
export { getCurrentElection, listElections } from './elections';
export { getMyRating, submitRating } from './ratings';
export type {
  AccessSession,
  ApiUser,
  Election,
  ElectionStatus,
  Lga,
  Rating,
  RatingInput,
  RegisterResult,
  Role,
  StateOption,
} from './types';
