import { z } from 'zod';

import {
  geopoliticalZoneSchema,
  ninHashSchema,
  phoneNumberSchema,
  roleSchema,
} from '../../shared/validation';


//self-registration is a citizen; officials and transcribers are admin-provisioned

export const registerBodySchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phoneNumber: phoneNumberSchema,
    email: z.string().trim().toLowerCase().email().max(255),
    ninHash: ninHashSchema,
    state: z.string().trim().min(2).max(60).optional(),
    geopoliticalZone: geopoliticalZoneSchema.optional(),
    // Optional codeword. When present, the account inherits the role + geographic
    // assignment encoded in the code (Yiaga official/transcriber self-provisioning).
    // When absent, the account is a plain citizen.
    inviteCode: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerBodySchema>;

/**
 * Details a user may *add* to their own account after registering.
 *
 * Add, not edit. Name, phone, and email are fixed once set — phone is the login
 * identity, and letting an account quietly change hands would undermine the
 * one-person-one-rating guarantee the whole record rests on. This exists so a
 * field left blank at signup can be filled in later without a support request.
 */
export const addMyDetailsBodySchema = z
  .object({
    state: z.string().trim().min(2).max(60),
  })
  .strict();

export type AddMyDetailsInput = z.infer<typeof addMyDetailsBodySchema>;

/** Public-safe user shape returned by auth endpoints. Never includes ninHash or fcmToken. */
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  role: roleSchema,
  state: z.string().nullable(),
  geopoliticalZone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
