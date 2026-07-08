import { Router } from 'express';

import { validate } from '../../shared/middleware/validate';
import { listAuditHandler } from './audit.controller';
import { auditQuerySchema } from './audit.schemas';

// /api/v1/audit
export const auditRouter = Router();

auditRouter.get('/', validate(auditQuerySchema, 'query'), listAuditHandler);
