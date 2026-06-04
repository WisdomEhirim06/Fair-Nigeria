import { z } from 'zod';



/** The five fixed account roles. Mirrors the user_role pg enum in the auth schema. */
export const ROLES = ['citizen', 'yiaga_official', 'yiaga_transcriber', 'super_admin'] as const;
export type Role = (typeof ROLES)[number];

/** Nigeria's six geopolitical zones. */
export const GEOPOLITICAL_ZONES = ['NW', 'NE', 'NC', 'SW', 'SE', 'SS'] as const;
export type GeopoliticalZone = (typeof GEOPOLITICAL_ZONES)[number];

/** Nigerian phone number in international format, e.g. +2348012345678. */
export const phoneNumberSchema = z
  .string()
  .regex(/^\+234\d{10}$/, 'Must be a Nigerian phone number in +234XXXXXXXXXX format');

/** SHA-256 hex digest of the NIN, computed on the client. 64 hex characters. */
export const ninHashSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{64}$/, 'Must be a 64-character SHA-256 hex hash');

/** A 6-digit OTP code. */
export const otpCodeSchema = z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits');

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const roleSchema = z.enum(ROLES);
export const geopoliticalZoneSchema = z.enum(GEOPOLITICAL_ZONES);

/** Standard pagination query. Coerces string query params to numbers with safe bounds. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
