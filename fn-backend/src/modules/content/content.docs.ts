import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import {
  articleSchema,
  articleSummarySchema,
  createArticleBodySchema,
  publishArticleBodySchema,
  updateArticleBodySchema,
} from './content.schemas';

//  Schemas

const CreateArticleRequest = registry.register(
  'CreateArticleRequest',
  createArticleBodySchema.openapi({
    example: {
      title: 'Know Your Voting Rights',
      category: 'voter_rights',
      excerpt: 'A plain-English guide to what you are entitled to at the polling unit.',
      body: 'Full article text…',
    },
    description: 'Creates an article in the unpublished state. Slug is derived from the title unless supplied.',
  }),
);

const UpdateArticleRequest = registry.register(
  'UpdateArticleRequest',
  updateArticleBodySchema.openapi({ example: { title: 'Know Your Voting Rights (2027)' } }),
);

const PublishArticleRequest = registry.register(
  'PublishArticleRequest',
  publishArticleBodySchema.openapi({ example: { isPublished: true } }),
);

const ArticleSummary = registry.register('ArticleSummary', articleSummarySchema);
const Article = registry.register('Article', articleSchema);

const categoryQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  category: z
    .enum(['voter_rights', 'accreditation', 'malpractice', 'reporting', 'civic_general'])
    .optional(),
});

//  Public endpoints

registry.registerPath({
  method: 'get',
  path: '/api/v1/articles',
  tags: ['Content'],
  summary: 'List published articles',
  description: 'Published, non-deleted articles, newest first. Paginated. Public.',
  request: { query: categoryQuery },
  responses: {
    200: jsonOk(z.array(ArticleSummary), 'Page of published articles.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/articles/{slug}',
  tags: ['Content'],
  summary: 'Get a published article by slug',
  description: 'Returns a single published, non-deleted article. Public.',
  request: { params: z.object({ slug: z.string() }) },
  responses: {
    200: jsonOk(Article, 'The article.'),
    404: jsonError('Article not found.'),
    ...commonErrors(),
  },
});

//  Admin endpoints

registry.registerPath({
  method: 'get',
  path: '/api/v1/articles/admin',
  tags: ['Content'],
  summary: 'List all articles (management view)',
  description: 'All articles including unpublished ones, newest first. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: { query: categoryQuery },
  responses: {
    200: jsonOk(z.array(ArticleSummary), 'Page of all articles.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/articles/admin/{id}',
  tags: ['Content'],
  summary: 'Get any article by id',
  description: 'Returns a single article in any state (for editing preview). Super admin only.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonOk(Article, 'The article.'),
    404: jsonError('Article not found.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/articles',
  tags: ['Content'],
  summary: 'Create an article',
  description: 'Creates an article in the unpublished state. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { 'application/json': { schema: CreateArticleRequest } } },
  },
  responses: {
    201: jsonOk(Article, 'Article created.'),
    409: jsonError('An article with that slug already exists.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/articles/{id}',
  tags: ['Content'],
  summary: 'Edit an article',
  description: 'Updates title, body, excerpt, or category in place. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { required: true, content: { 'application/json': { schema: UpdateArticleRequest } } },
  },
  responses: {
    200: jsonOk(Article, 'Updated article.'),
    404: jsonError('Article not found.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/articles/{id}/publish',
  tags: ['Content'],
  summary: 'Publish or unpublish an article',
  description:
    'Sets the published flag. Publishing stamps publishedAt on the first publish and ' +
    'preserves it thereafter. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { required: true, content: { 'application/json': { schema: PublishArticleRequest } } },
  },
  responses: {
    200: jsonOk(Article, 'Updated article.'),
    404: jsonError('Article not found.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/articles/{id}',
  tags: ['Content'],
  summary: 'Delete an article',
  description:
    'Permanently deletes the article. Irreversible — but the article.delete audit ' +
    'record is retained as the permanent log of the action. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonOk(Article, 'The deleted article (pre-delete snapshot).'),
    404: jsonError('Article not found.'),
    ...authErrors(),
    ...commonErrors(),
  },
});
