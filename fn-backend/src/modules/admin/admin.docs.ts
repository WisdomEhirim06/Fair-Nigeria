import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { publicUserSchema } from '../auth/auth.schemas';
import {
  createInviteCodeBodySchema,
  inviteCodeSchema,
  updateUserBodySchema,
} from './admin.schemas';

//  Schemas

const CreateInviteCodeRequest = registry.register(
  'CreateInviteCodeRequest',
  createInviteCodeBodySchema.openapi({
    example: {
      role: 'yiaga_official',
      state: 'Lagos',
      geopoliticalZone: 'SW',
      maxUses: 80,
      expiresAt: '2027-01-15T00:00:00.000Z',
    },
  }),
);

const InviteCode = registry.register('InviteCode', inviteCodeSchema);

const InviteCodeCreated = registry.register(
  'InviteCodeCreated',
  z.object({
    code: z
      .string()
      .openapi({
        example: 'lion harvest anchor delta k7m2pq',
        description: 'The plaintext codeword. Returned ONCE — share it now; it cannot be retrieved again.',
      }),
    inviteCode: inviteCodeSchema,
  }),
);

const UpdateUserRequest = registry.register(
  'UpdateUserRequest',
  updateUserBodySchema.openapi({
    example: { role: 'yiaga_official', state: 'Lagos', geopoliticalZone: 'SW', isActive: true },
  }),
);

const allAdminErrors = () => ({ ...authErrors(), ...commonErrors() });

//  Invite code endpoints

registry.registerPath({
  method: 'post',
  path: '/api/v1/invite-codes',
  tags: ['Admin'],
  summary: 'Create an invite codeword',
  description:
    'Mints a codeword carrying a role + geographic assignment. Anyone who registers ' +
    'with this code becomes a Yiaga official/transcriber for that state/zone. ' +
    'The plaintext codeword is returned once and never stored — only its hash is kept. ' +
    'Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { 'application/json': { schema: CreateInviteCodeRequest } } },
  },
  responses: {
    201: jsonOk(InviteCodeCreated, 'Codeword created.'),
    409: jsonError('A codeword with that phrase already exists.'),
    ...allAdminErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/invite-codes',
  tags: ['Admin'],
  summary: 'List invite codewords',
  description: 'Lists all codewords with usage stats (usedCount / maxUses). Super admin only.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonOk(z.array(InviteCode), 'All invite codes.'),
    ...allAdminErrors(),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/invite-codes/{id}',
  tags: ['Admin'],
  summary: 'Revoke an invite codeword',
  description: 'Deactivates a codeword so it can no longer be redeemed. Idempotent. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonOk(InviteCode, 'Codeword revoked.'),
    404: jsonError('Invite code not found.'),
    ...allAdminErrors(),
  },
});

//  User management endpoints

registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  tags: ['Admin'],
  summary: 'List users',
  description:
    'Paginated, filterable list of users (filter by role, state, isActive). ' +
    'Pagination is returned in meta.pagination. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      role: z.enum(['citizen', 'yiaga_official', 'yiaga_transcriber', 'super_admin']).optional(),
      state: z.string().optional(),
      isActive: z.enum(['true', 'false']).optional(),
    }),
  },
  responses: {
    200: jsonOk(z.array(publicUserSchema), 'Page of users.'),
    ...allAdminErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/{id}',
  tags: ['Admin'],
  summary: 'Get a user',
  description: 'Returns a single user (including inactive ones). Super admin only.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonOk(publicUserSchema, 'User profile.'),
    404: jsonError('User not found.'),
    ...allAdminErrors(),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/users/{id}',
  tags: ['Admin'],
  summary: 'Update a user',
  description:
    'Update a user\'s role, active status, geographic assignment, or FCM token. ' +
    'Used to promote/deactivate officials and reassign them. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { required: true, content: { 'application/json': { schema: UpdateUserRequest } } },
  },
  responses: {
    200: jsonOk(publicUserSchema, 'Updated user.'),
    404: jsonError('User not found.'),
    ...allAdminErrors(),
  },
});
