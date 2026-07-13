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
