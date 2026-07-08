import { and, count, desc, eq, type SQL } from 'drizzle-orm';

import { appDb } from '../../db';
import { articles, type Article } from '../../db/app/schema';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import { writeAudit, type AuditActor } from '../audit/audit.service';
import type {
  ArticleSummary,
  CreateArticleInput,
  ListArticlesQuery,
  PublicArticle,
  UpdateArticleInput,
} from './content.schemas';

/** Derive a URL-safe slug from arbitrary text. */
function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  return slug || 'article';
}

function toSummary(row: Article): ArticleSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFull(row: Article): PublicArticle {
  return { ...toSummary(row), body: row.body };
}

export interface PaginatedArticles {
  articles: ArticleSummary[];
  total: number;
}

//  Public reads (published, not soft-deleted)

export async function listPublishedArticles(query: ListArticlesQuery): Promise<PaginatedArticles> {
  const conditions: SQL[] = [eq(articles.isPublished, true)];
  if (query.category) conditions.push(eq(articles.category, query.category));

  const where = and(...conditions);
  const offset = (query.page - 1) * query.limit;

  const [rows, [{ total }]] = await Promise.all([
    appDb
      .select()
      .from(articles)
      .where(where)
      .orderBy(desc(articles.publishedAt))
      .limit(query.limit)
      .offset(offset),
    appDb.select({ total: count() }).from(articles).where(where),
  ]);

  return { articles: rows.map(toSummary), total };
}

export async function getPublishedArticleBySlug(slug: string): Promise<PublicArticle> {
  const [row] = await appDb
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.isPublished, true)))
    .limit(1);

  if (!row) {
    throw new AppError('NOT_FOUND', 'Article not found.');
  }
  return toFull(row);
}

//  Admin reads (any state)

export async function listAllArticles(query: ListArticlesQuery): Promise<PaginatedArticles> {
  const where = query.category ? eq(articles.category, query.category) : undefined;
  const offset = (query.page - 1) * query.limit;

  const [rows, [{ total }]] = await Promise.all([
    appDb
      .select()
      .from(articles)
      .where(where)
      .orderBy(desc(articles.createdAt))
      .limit(query.limit)
      .offset(offset),
    appDb.select({ total: count() }).from(articles).where(where),
  ]);

  return { articles: rows.map(toSummary), total };
}

export async function getArticleById(id: string): Promise<PublicArticle> {
  const [row] = await appDb.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!row) {
    throw new AppError('NOT_FOUND', 'Article not found.');
  }
  return toFull(row);
}

//  Writes (super admin) — each audited inside its transaction

export async function createArticle(
  input: CreateArticleInput,
  actor: AuditActor,
): Promise<PublicArticle> {
  const slug = input.slug ?? slugify(input.title);

  try {
    const row = await appDb.transaction(async (tx) => {
      const [created] = await tx
        .insert(articles)
        .values({
          slug,
          title: input.title,
          category: input.category,
          excerpt: input.excerpt ?? null,
          body: input.body,
          authorId: actor.id,
        })
        .returning();

      await writeAudit(
        {
          actorId: actor.id,
          actorRole: actor.role,
          action: 'article.create',
          entityType: 'article',
          entityId: created.id,
          metadata: { slug: created.slug, category: created.category },
          ipAddress: actor.ip,
        },
        tx,
      );

      return created;
    });

    return toFull(row);
  } catch (err) {
    if (isUniqueViolation(err, 'articles_slug_unique')) {
      throw new AppError(
        'DUPLICATE_SLUG',
        `An article with the slug '${slug}' already exists. Supply a different slug.`,
        'slug',
      );
    }
    throw err;
  }
}

export async function updateArticle(
  id: string,
  patch: UpdateArticleInput,
  actor: AuditActor,
): Promise<PublicArticle> {
  const [existing] = await appDb.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Article not found.');
  }

  const row = await appDb.transaction(async (tx) => {
    const [updated] = await tx
      .update(articles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();

    await writeAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'article.update',
        entityType: 'article',
        entityId: id,
        metadata: { fields: Object.keys(patch) },
        ipAddress: actor.ip,
      },
      tx,
    );

    return updated;
  });

  return toFull(row);
}

export async function setArticlePublished(
  id: string,
  isPublished: boolean,
  actor: AuditActor,
): Promise<PublicArticle> {
  const [existing] = await appDb.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Article not found.');
  }

  // Stamp publishedAt only on the first publish; preserve it thereafter.
  const publishedAt =
    isPublished && existing.publishedAt === null ? new Date() : existing.publishedAt;

  const row = await appDb.transaction(async (tx) => {
    const [updated] = await tx
      .update(articles)
      .set({ isPublished, publishedAt, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();

    await writeAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: isPublished ? 'article.publish' : 'article.unpublish',
        entityType: 'article',
        entityId: id,
        ipAddress: actor.ip,
      },
      tx,
    );

    return updated;
  });

  return toFull(row);
}

export async function deleteArticle(id: string, actor: AuditActor): Promise<PublicArticle> {
  const [existing] = await appDb.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Article not found.');
  }

  // Hard delete: the row is removed entirely. The article.delete audit row remains
  // as the permanent, immutable record that the deletion happened (no FK to articles).
  await appDb.transaction(async (tx) => {
    await tx.delete(articles).where(eq(articles.id, id));

    await writeAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'article.delete',
        entityType: 'article',
        entityId: id,
        metadata: { slug: existing.slug, title: existing.title },
        ipAddress: actor.ip,
      },
      tx,
    );
  });

  
  return toFull(existing);
}
