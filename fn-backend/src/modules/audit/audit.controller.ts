import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import { auditQuerySchema } from './audit.schemas';
import { listAuditLog } from './audit.service';

// GET /audit
export const listAuditHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = auditQuerySchema.parse(req.query);
    const { entries, pagination } = await listAuditLog(query);
    res.json(successEnvelope(entries, req.id as unknown as string, pagination));
  } catch (err) {
    next(err);
  }
};
