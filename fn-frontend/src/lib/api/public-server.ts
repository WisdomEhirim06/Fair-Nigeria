import type { Article, ArticleSummary } from './types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1').replace(
  /\/+$/,
  '',
);

interface Envelope<T> {
  success: boolean;
  data?: T;
}

/** Seconds before Next refetches. Content changes rarely; results often. */
export const REVALIDATE_CONTENT = 600;
export const REVALIDATE_RESULTS = 60;

async function fetchPublic<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { accept: 'application/json' },
      next: { revalidate },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Envelope<T>;
    return body.success && body.data !== undefined ? body.data : null;
  } catch {
    // Network failure, DNS, backend down — the caller decides what to show.
    return null;
  }
}

/** A single published article by slug. `null` when missing or unpublished. */
export function getArticleServer(slug: string): Promise<Article | null> {
  return fetchPublic<Article>(`/articles/${encodeURIComponent(slug)}`, REVALIDATE_CONTENT);
}

/** Every published article, for the sitemap and the library page. */
export async function listArticlesServer(): Promise<ArticleSummary[]> {
  return (await fetchPublic<ArticleSummary[]>('/articles', REVALIDATE_CONTENT)) ?? [];
}
