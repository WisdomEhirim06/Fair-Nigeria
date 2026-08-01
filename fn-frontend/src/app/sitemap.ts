import type { MetadataRoute } from 'next';

import { listArticlesServer } from '@/lib/api/public-server';
import { absoluteUrl } from '@/lib/seo/site';


export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/results'), lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: absoluteUrl('/sheets'), lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: absoluteUrl('/articles'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/audit'), lastModified: now, changeFrequency: 'daily', priority: 0.6 },
  ];

  const articles = await listArticlesServer();

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: new Date(article.updatedAt ?? article.publishedAt ?? article.createdAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
