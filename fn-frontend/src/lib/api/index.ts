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
export {
  uploadSheet,
  listMyUploads,
  flagSheet,
  type UploadSheetInput,
  type MyUploadsFilters,
} from './sheets';
export { claimNextSheet, getQueueStatus, submitEntry } from './transcription';
export { listAudit, type AuditFilters } from './audit';
export type {
  AccessSession,
  ApiUser,
  AuditEntry,
  Claim,
  Election,
  ElectionStatus,
  FigureTotals,
  Lga,
  LgaRatingSummary,
  Party,
  PartyTotal,
  QueueStatus,
  Rating,
  RatingInput,
  RatingScores,
  RatingsDashboard,
  RegisterResult,
  ResultsDashboard,
  Role,
  Sheet,
  SheetCounts,
  SheetStatus,
  StateOption,
  StateResultSummary,
  TranscriptionInput,
  TranscriptionResult,
} from './types';
