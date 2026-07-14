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
