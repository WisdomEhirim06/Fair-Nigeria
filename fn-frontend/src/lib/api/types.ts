export type Role = 'citizen' | 'yiaga_official' | 'yiaga_transcriber' | 'super_admin';

/** Public-safe user, as returned by /auth endpoints. Never includes the NIN hash. */
export interface ApiUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: Role;
  state: string | null;
  geopoliticalZone: string | null;
  isActive: boolean;
  createdAt: string;
}

// verify-otp response
export interface AccessSession {
  accessToken: string;
  expiresIn: number;
}

// register response.
export interface RegisterResult {
  user: ApiUser;
  otpSent: boolean;
}

// A state option for the registration dropdown.
export interface StateOption {
  id: string;
  name: string;
  alias: string;
  zone: string;
}

// An LGA within a state (for the rating location cascade).
export interface Lga {
  id: string;
  stateId: string;
  name: string;
}

export type ElectionStatus = 'upcoming' | 'active' | 'concluded';

// Roles a super admin can mint via invite codes (super_admin is seed-only).
export type ProvisionableRole = 'yiaga_official' | 'yiaga_transcriber';

// Nigeria's six geopolitical zones.
export type GeopoliticalZone = 'NW' | 'NE' | 'NC' | 'SW' | 'SE' | 'SS';

// An invite code as the admin sees it. Never includes the code hash.
export interface InviteCode {
  id: string;
  role: Role;
  state: string | null;
  geopoliticalZone: string | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

// Result of minting a code: the plaintext is shown ONCE, here only.
export interface CreatedInviteCode {
  code: string;
  inviteCode: InviteCode;
}

export interface Election {
  id: string;
  name: string;
  type: string;
  electionDate: string;
  status: ElectionStatus;
  createdAt: string;
  updatedAt: string;
}

// A citizen's submitted rating
export interface Rating {
  id: string;
  electionId: string;
  lgaId: string;
  noIntimidation: boolean;
  accreditationProper: boolean;
  votingOrderly: boolean;
  securityPresent: boolean;
  witnessedMalpractice: boolean;
  createdAt: string;
}

// Body for POST /ratings.
export interface RatingInput {
  electionId: string;
  lgaId: string;
  noIntimidation: boolean;
  accreditationProper: boolean;
  votingOrderly: boolean;
  securityPresent: boolean;
  witnessedMalpractice: boolean;
}

// Public dashboards

export interface FigureTotals {
  accreditedVoters: number;
  totalValidVotes: number;
  rejectedBallots: number;
  totalVotesCast: number;
}

export interface SheetCounts {
  verified: number;
  disputed: number;
  pending: number;
}

export interface PartyTotal {
  partyId: string;
  abbreviation: string;
  name: string;
  votes: number;
}

export interface StateResultSummary {
  stateId: string;
  stateName: string;
  sheetCounts: SheetCounts;
  figures: FigureTotals;
  partyTotals: PartyTotal[];
}

export interface ResultsDashboard {
  electionId: string;
  lastUpdated: string | null;
  sheetCounts: SheetCounts;
  national: { figures: FigureTotals; partyTotals: PartyTotal[] };
  byState: StateResultSummary[];
}

/** Per-question yes-fractions (0–1). */
export interface RatingScores {
  noIntimidation: number;
  accreditationProper: number;
  votingOrderly: number;
  securityPresent: number;
  witnessedMalpractice: number;
}

export interface LgaRatingSummary {
  lgaId: string;
  lgaName: string;
  stateId: string;
  stateName: string;
  count: number;
  scores: RatingScores;
}

export interface RatingsDashboard {
  electionId: string;
  totalRatings: number;
  lastUpdated: string | null;
  byLga: LgaRatingSummary[];
}

// Civic library articles.
export type ArticleCategory =
  | 'voter_rights'
  | 'accreditation'
  | 'malpractice'
  | 'reporting'
  | 'civic_general';

/** List shape — no body. */
export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  category: ArticleCategory;
  excerpt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full article, including the Markdown body. */
export interface Article extends ArticleSummary {
  body: string;
}

export type SheetStatus = 'pending' | 'verified' | 'disputed';

// An uploaded EC8A result sheet. Never exposes the uploader's identity.
export interface Sheet {
  id: string;
  electionId: string;
  stateId: string;
  lgaId: string;
  puCode: string;
  fileHash: string;
  fileUrl: string | null;
  mimeType: string;
  fileSize: number;
  status: SheetStatus;
  flagCount: number;
  createdAt: string;
}

// A party configured for an election (shown to the transcriber as vote inputs).
export interface Party {
  id: string;
  electionId: string;
  name: string;
  abbreviation: string;
  candidateName: string | null;
  createdAt: string;
}

// The sheet + parties handed to a transcriber by POST /transcription/claim.
export interface Claim {
  sheet: Sheet;
  parties: Party[];
}

// How many sheets await this transcriber. Count only — never which sheets.
export interface QueueStatus {
  waiting: number;
}

// Body for POST /transcription/entries — one reading of a sheet's figures.
export interface TranscriptionInput {
  sheetId: string;
  accreditedVoters: number;
  totalValidVotes: number;
  rejectedBallots: number;
  totalVotesCast: number;
  partyVotes: Record<string, number>;
}

// Confirmation returned after a reading is accepted.
export interface TranscriptionResult {
  id: string;
  sheetId: string;
  figureHash: string;
  createdAt: string;
  sheetStatus: SheetStatus;
}

// A public audit-trail entry. Sanitised — role only, never the actor's id or IP.
export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorRole: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
