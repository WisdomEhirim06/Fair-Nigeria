import type { RequestHandler } from 'express';

import { successEnvelope, type Pagination } from '../../shared/response';
import type { AuditActor } from '../audit/audit.service';
import {
  createArticle,
  deleteArticle,
  getArticleById,
  getPublishedArticleBySlug,
  listAllArticles,
  listPublishedArticles,
  setArticlePublished,
  updateArticle,
  type PaginatedArticles,
} from './content.service';
import {
  listArticlesQuerySchema,
  type CreateArticleInput,
  type IdParam,
  type PublishArticleInput,
  type SlugParam,
  type UpdateArticleInput,
} from './content.schemas';

/** Build the audit actor from the authenticated request. */
function actorFrom(req: Parameters<RequestHandler>[0]): AuditActor {
  return { id: req.user!.id, role: req.user!.role, ip: req.ip ?? null };
}

function paginationFrom(page: number, limit: number, total: number): Pagination {
  return { page, limit, total, hasNext: page * limit < total };
}

//  Public reads

/** GET /articles — published, non-deleted articles, paginated. Public. */
export const listArticlesHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listArticlesQuerySchema.parse(req.query);
    const result: PaginatedArticles = await listPublishedArticles(query);
    const requestId = req.id as unknown as string;
    res.json(
      successEnvelope(
        result.articles,
        requestId,
        paginationFrom(query.page, query.limit, result.total),
      ),
    );
  } catch (err) {
    next(err);
  }
};

/** GET /articles/:slug — a single published article. Public. */
export const getArticleBySlugHandler: RequestHandler = async (req, res, next) => {
  try {
    const article = await getPublishedArticleBySlug((req.params as SlugParam).slug);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(article, requestId));
  } catch (err) {
    next(err);
  }
};

/** GET /articles/admin — all articles incl. unpublished, paginated. Super admin. */
export const listAllArticlesHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listArticlesQuerySchema.parse(req.query);
    const result = await listAllArticles(query);
    const requestId = req.id as unknown as string;
    res.json(
      successEnvelope(
        result.articles,
        requestId,
        paginationFrom(query.page, query.limit, result.total),
      ),
    );
  } catch (err) {
    next(err);
  }
};

/** GET /articles/admin/:id — a single article in any state. Super admin. */
export const getArticleByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const article = await getArticleById((req.params as IdParam).id);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(article, requestId));
  } catch (err) {
    next(err);
  }
};

//  Writes (super admin)

/** POST /articles — create an article (starts unpublished). Super admin. */
export const createArticleHandler: RequestHandler = async (req, res, next) => {
  try {
    const article = await createArticle(req.body as CreateArticleInput, actorFrom(req));
    const requestId = req.id as unknown as string;
    res.status(201).json(successEnvelope(article, requestId));
  } catch (err) {
    next(err);
  }
};

/** PATCH /articles/:id — edit title/body/excerpt/category. Super admin. */
export const updateArticleHandler: RequestHandler = async (req, res, next) => {
  try {
    const article = await updateArticle(
      (req.params as IdParam).id,
      req.body as UpdateArticleInput,
      actorFrom(req),
    );
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(article, requestId));
  } catch (err) {
    next(err);
  }
};

/** PATCH /articles/:id/publish — publish or unpublish. Super admin. */
export const publishArticleHandler: RequestHandler = async (req, res, next) => {
  try {
    const { isPublished } = req.body as PublishArticleInput;
    const article = await setArticlePublished(
      (req.params as IdParam).id,
      isPublished,
      actorFrom(req),
    );
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(article, requestId));
  } catch (err) {
    next(err);
  }
};

/** DELETE /articles/:id — permanently delete. Super admin. */
export const deleteArticleHandler: RequestHandler = async (req, res, next) => {
  try {
    const article = await deleteArticle((req.params as IdParam).id, actorFrom(req));
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(article, requestId));
  } catch (err) {
    next(err);
  }
};
