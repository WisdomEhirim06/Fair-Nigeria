import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import {
  createArticleHandler,
  deleteArticleHandler,
  getArticleByIdHandler,
  getArticleBySlugHandler,
  listAllArticlesHandler,
  listArticlesHandler,
  publishArticleHandler,
  updateArticleHandler,
} from './content.controller';
import {
  createArticleBodySchema,
  idParamSchema,
  listArticlesQuerySchema,
  publishArticleBodySchema,
  slugParamSchema,
  updateArticleBodySchema,
} from './content.schemas';


export const articlesRouter = Router();

const adminOnly = [requireAuth, requireRole('super_admin')] as const;

// Admin reads — registered before '/:slug' so 'admin' isn't captured as a slug.
articlesRouter.get(
  '/admin',
  ...adminOnly,
  validate(listArticlesQuerySchema, 'query'),
  listAllArticlesHandler,
);
articlesRouter.get(
  '/admin/:id',
  ...adminOnly,
  validate(idParamSchema, 'params'),
  getArticleByIdHandler,
);

// Super-admin writes.
articlesRouter.post('/', ...adminOnly, validate(createArticleBodySchema), createArticleHandler);
articlesRouter.patch(
  '/:id/publish',
  ...adminOnly,
  validate(idParamSchema, 'params'),
  validate(publishArticleBodySchema),
  publishArticleHandler,
);
articlesRouter.patch(
  '/:id',
  ...adminOnly,
  validate(idParamSchema, 'params'),
  validate(updateArticleBodySchema),
  updateArticleHandler,
);
articlesRouter.delete('/:id', ...adminOnly, validate(idParamSchema, 'params'), deleteArticleHandler);

// Public reads.
articlesRouter.get('/', validate(listArticlesQuerySchema, 'query'), listArticlesHandler);
articlesRouter.get('/:slug', validate(slugParamSchema, 'params'), getArticleBySlugHandler);
