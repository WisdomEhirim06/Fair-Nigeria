import { Router } from 'express';

/**
 * Civic content module: public reading of published articles by
 * category/slug, and Super Admin authoring (create, edit, publish/unpublish,
 * soft delete). Base path: /api/v1/articles
 */
export const articlesRouter = Router();
