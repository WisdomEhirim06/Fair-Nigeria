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
export { getResultsDashboard, getRatingsDashboard } from './dashboard';
export type {
  AccessSession,
  ApiUser,
  Election,
  ElectionStatus,
  FigureTotals,
  Lga,
  LgaRatingSummary,
  PartyTotal,
  Rating,
  RatingInput,
  RatingScores,
  RatingsDashboard,
  RegisterResult,
  ResultsDashboard,
  Role,
  SheetCounts,
  StateOption,
  StateResultSummary,
} from './types';
