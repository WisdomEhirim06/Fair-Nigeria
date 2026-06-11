import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import {
  createInviteCodeHandler,
  getUserHandler,
  listInviteCodesHandler,
  listUsersHandler,
  revokeInviteCodeHandler,
  updateUserHandler,
} from './admin.controller';
import {
  createInviteCodeBodySchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserBodySchema,
} from './admin.schemas';

/**
 * All admin routes require a valid Bearer token AND the super_admin role.
 * requireAuth runs first (sets req.user), then requireRole gates on the role.
 */

export const inviteCodesRouter = Router();
inviteCodesRouter.use(requireAuth, requireRole('super_admin'));

inviteCodesRouter.post('/', validate(createInviteCodeBodySchema), createInviteCodeHandler);
inviteCodesRouter.get('/', listInviteCodesHandler);
inviteCodesRouter.delete('/:id', validate(idParamSchema, 'params'), revokeInviteCodeHandler);

export const usersRouter = Router();
usersRouter.use(requireAuth, requireRole('super_admin'));

usersRouter.get('/', validate(listUsersQuerySchema, 'query'), listUsersHandler);
usersRouter.get('/:id', validate(idParamSchema, 'params'), getUserHandler);
usersRouter.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateUserBodySchema),
  updateUserHandler,
);
