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
export {
  getCurrentElection,
  getElection,
  listElections,
  createElection,
  changeElectionStatus,
  type CreateElectionInput,
} from './elections';
export {
  listParties,
  createParty,
  updateParty,
  deleteParty,
  type PartyInput,
} from './parties';
export {
  listInviteCodes,
  createInviteCode,
  revokeInviteCode,
  listUsers,
  updateUser,
  type CreateInviteCodeInput,
  type ListUsersFilters,
  type UpdateUserInput,
} from './admin';
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
  CreatedInviteCode,
  Election,
  ElectionStatus,
  FigureTotals,
  GeopoliticalZone,
  InviteCode,
  Lga,
  LgaRatingSummary,
  Party,
  ProvisionableRole,
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
