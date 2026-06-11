import { z } from 'zod';

import {
  geopoliticalZoneSchema,
  paginationQuerySchema,
  provisionableRoleSchema,
  roleSchema,
  uuidSchema,
} from '../../shared/validation';

/** Booleans arrive as query strings ("true"/"false"); coerce them explicitly. */
const booleanQuery = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

//  Invite codes

export const createInviteCodeBodySchema = z
  .object({
    role: provisionableRoleSchema,
    state: z.string().trim().min(2).max(60).optional(),
    geopoliticalZone: geopoliticalZoneSchema.optional(),
    maxUses: z.number().int().min(1).max(100_000),
    // ISO-8601 timestamp; must be in the future (validated in the service against now()).
    expiresAt: z.string().datetime(),
    // Optional admin-supplied codeword. If omitted, the system generates one.
    // Enforced minimum strength so an admin can't set a trivially guessable phrase.
    code: z.string().trim().min(12).max(120).optional(),
  })
  .strict();

export type CreateInviteCodeInput = z.infer<typeof createInviteCodeBodySchema>;

/** Public-safe invite code shape. Never includes codeHash. */
export const inviteCodeSchema = z.object({
  id: z.string().uuid(),
  role: roleSchema,
  state: z.string().nullable(),
  geopoliticalZone: z.string().nullable(),
  maxUses: z.number().int(),
  usedCount: z.number().int(),
  isActive: z.boolean(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type PublicInviteCode = z.infer<typeof inviteCodeSchema>;

//  User management

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: roleSchema.optional(),
  state: z.string().trim().min(2).max(60).optional(),
  isActive: booleanQuery.optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const updateUserBodySchema = z
  .object({
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
    state: z.string().trim().min(2).max(60).optional(),
    geopoliticalZone: geopoliticalZoneSchema.optional(),
    fcmToken: z.string().min(1).max(512).nullable().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, {
    message: 'Provide at least one field to update.',
  });

export type UpdateUserInput = z.infer<typeof updateUserBodySchema>;

export const idParamSchema = z.object({ id: uuidSchema });
export type IdParam = z.infer<typeof idParamSchema>;
