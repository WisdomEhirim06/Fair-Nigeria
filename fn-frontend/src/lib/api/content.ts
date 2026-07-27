import { request } from './client';
import type { Article, ArticleCategory, ArticleSummary } from './types';


export async function listArticles(category?: ArticleCategory): Promise<ArticleSummary[]> {
  const qs = category ? `?category=${category}&limit=100` : '?limit=100';
  return request<ArticleSummary[]>(`/articles${qs}`, { method: 'GET' });
}


export async function getArticle(slug: string): Promise<Article> {
  return request<Article>(`/articles/${slug}`, { method: 'GET' });
}

//  Admin 

// All articles including drafts
export async function listAllArticles(category?: ArticleCategory): Promise<ArticleSummary[]> {
  const qs = category ? `?category=${category}&limit=100` : '?limit=100';
  return request<ArticleSummary[]>(`/articles/admin${qs}`, { method: 'GET' });
}

/** A single article in any state, for editing. */
export async function getArticleById(id: string): Promise<Article> {
  return request<Article>(`/articles/admin/${id}`, { method: 'GET' });
}

export interface CreateArticleInput {
  title: string;
  category: ArticleCategory;
  body: string;
  excerpt?: string;
  slug?: string;
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  return request<Article>('/articles', { method: 'POST', body: JSON.stringify(input) });
}

export interface UpdateArticleInput {
  title?: string;
  category?: ArticleCategory;
  body?: string;
  excerpt?: string | null;
}

export async function updateArticle(id: string, patch: UpdateArticleInput): Promise<Article> {
  return request<Article>(`/articles/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

// Publish or unpublish.
export async function setArticlePublished(id: string, isPublished: boolean): Promise<Article> {
  return request<Article>(`/articles/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublished }),
  });
}

export async function deleteArticle(id: string): Promise<Article> {
  return request<Article>(`/articles/${id}`, { method: 'DELETE' });
}
