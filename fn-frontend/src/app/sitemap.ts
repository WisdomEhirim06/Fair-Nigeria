import type { MetadataRoute } from 'next';

import { listArticlesServer } from '@/lib/api/public-server';
import { absoluteUrl } from '@/lib/seo/site';


export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticlesServer();

  // Most recently published/updated article — a stable lastmod for the routes
  // whose freshness actually tracks content, instead of churning on every regen.
  const latestArticle = articles.reduce<Date | null>((latest, a) => {
    const d = new Date(a.updatedAt ?? a.publishedAt ?? a.createdAt);
    return !latest || d > latest ? d : latest;
  }, null);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'weekly',
      priority: 1,
      ...(latestArticle ? { lastModified: latestArticle } : {}),
    },
    { url: absoluteUrl('/results'), changeFrequency: 'hourly', priority: 0.9 },
    { url: absoluteUrl('/sheets'), changeFrequency: 'hourly', priority: 0.8 },
    {
      url: absoluteUrl('/articles'),
      changeFrequency: 'weekly',
      priority: 0.7,
      ...(latestArticle ? { lastModified: latestArticle } : {}),
    },
    { url: absoluteUrl('/audit'), changeFrequency: 'daily', priority: 0.6 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: new Date(article.updatedAt ?? article.publishedAt ?? article.createdAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
