import { z } from 'zod';

import { paginationQuerySchema, uuidSchema } from '../../shared/validation';

/** Fixed civic-content categories. Mirrors the article_category pg enum. */
export const ARTICLE_CATEGORIES = [
  'voter_rights',
  'accreditation',
  'malpractice',
  'reporting',
  'civic_general',
] as const;
export const articleCategorySchema = z.enum(ARTICLE_CATEGORIES);
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

/** Lowercase, hyphen-separated slug, e.g. 'know-your-voting-rights'. */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by single hyphens');

export const createArticleBodySchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    category: articleCategorySchema,
    excerpt: z.string().trim().min(1).max(300).optional(),
    body: z.string().trim().min(1),
    // Optional override; if omitted, the slug is derived from the title.
    slug: slugSchema.optional(),
  })
  .strict();

export type CreateArticleInput = z.infer<typeof createArticleBodySchema>;

export const updateArticleBodySchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    category: articleCategorySchema.optional(),
    excerpt: z.string().trim().min(1).max(300).nullable().optional(),
    body: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, {
    message: 'Provide at least one field to update.',
  });

export type UpdateArticleInput = z.infer<typeof updateArticleBodySchema>;

export const publishArticleBodySchema = z.object({ isPublished: z.boolean() }).strict();
export type PublishArticleInput = z.infer<typeof publishArticleBodySchema>;

export const listArticlesQuerySchema = paginationQuerySchema.extend({
  category: articleCategorySchema.optional(),
});
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

export const slugParamSchema = z.object({ slug: slugSchema });
export type SlugParam = z.infer<typeof slugParamSchema>;

export const idParamSchema = z.object({ id: uuidSchema });
export type IdParam = z.infer<typeof idParamSchema>;

/** Summary shape for list views — omits the (potentially large) body. */
export const articleSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  category: articleCategorySchema,
  excerpt: z.string().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ArticleSummary = z.infer<typeof articleSummarySchema>;

/** Full article shape — summary plus the body. */
export const articleSchema = articleSummarySchema.extend({ body: z.string() });
export type PublicArticle = z.infer<typeof articleSchema>;
