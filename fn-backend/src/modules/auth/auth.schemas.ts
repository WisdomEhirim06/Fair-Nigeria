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
    ninHash: ninHashSchema,
    state: z.string().trim().min(2).max(60).optional(),
    geopoliticalZone: geopoliticalZoneSchema.optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerBodySchema>;

/** Public-safe user shape returned by auth endpoints. Never includes ninHash or fcmToken. */
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phoneNumber: z.string(),
  role: roleSchema,
  state: z.string().nullable(),
  geopoliticalZone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
