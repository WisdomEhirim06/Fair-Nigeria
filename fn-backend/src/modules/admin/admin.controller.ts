import type { RequestHandler } from 'express';

import { successEnvelope, type Pagination } from '../../shared/response';
import { type AuditActor } from '../audit/audit.service';
import {
  listUsersQuerySchema,
  type CreateInviteCodeInput,
  type IdParam,
  type UpdateUserInput,
} from './admin.schemas';
import {
  createInviteCode,
  getUser,
  listInviteCodes,
  listUsers,
  revokeInviteCode,
  updateUser,
} from './admin.service';

/** Build the audit actor from the authenticated request. */
function actorFrom(req: Parameters<RequestHandler>[0]): AuditActor {
  return { id: req.user!.id, role: req.user!.role, ip: req.ip ?? null };
}

//  Invite codes

/** POST /invite-codes — mint a codeword. The plaintext is returned once, here only. */
export const createInviteCodeHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await createInviteCode(req.body as CreateInviteCodeInput, actorFrom(req));
    const requestId = req.id as unknown as string;
    res.status(201).json(successEnvelope(result, requestId));
  } catch (err) {
    next(err);
  }
};

/** GET /invite-codes — list all codes with usage stats. */
export const listInviteCodesHandler: RequestHandler = async (req, res, next) => {
  try {
    const codes = await listInviteCodes();
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(codes, requestId));
  } catch (err) {
    next(err);
  }
};

/** DELETE /invite-codes/:id — revoke a code. */
export const revokeInviteCodeHandler: RequestHandler = async (req, res, next) => {
  try {
    const code = await revokeInviteCode((req.params as IdParam).id, actorFrom(req));
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(code, requestId));
  } catch (err) {
    next(err);
  }
};

//  User management

/** GET /users — paginated, filterable list of users. */
export const listUsersHandler: RequestHandler = async (req, res, next) => {
  try {
    // Re-parse here (not just in the validate middleware): Express 5's req.query is a
    // getter, so coerced numbers/defaults from validate's Object.assign may not persist.
    const query = listUsersQuerySchema.parse(req.query);
    const { users, total } = await listUsers(query);
    const pagination: Pagination = {
      page: query.page,
      limit: query.limit,
      total,
      hasNext: query.page * query.limit < total,
    };
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(users, requestId, pagination));
  } catch (err) {
    next(err);
  }
};

/** GET /users/:id — single user profile. */
export const getUserHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = await getUser((req.params as IdParam).id);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(user, requestId));
  } catch (err) {
    next(err);
  }
};

/** PATCH /users/:id — update role, status, geographic assignment, or FCM token. */
export const updateUserHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = await updateUser(
      (req.params as IdParam).id,
      req.body as UpdateUserInput,
      actorFrom(req),
    );
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(user, requestId));
  } catch (err) {
    next(err);
  }
};
