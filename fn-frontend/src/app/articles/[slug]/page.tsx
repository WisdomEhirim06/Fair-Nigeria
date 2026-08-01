import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageChrome } from '@/components/app/PageChrome';
import { ArticleView } from '@/components/content/ArticleView';
import { JsonLd } from '@/components/seo/JsonLd';
import { getArticleServer } from '@/lib/api/public-server';
import { SITE_NAME, SITE_URL, absoluteUrl, metaDescription } from '@/lib/seo/site';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleServer(slug);

  
  if (!article) {
    return { title: 'Article not found', robots: { index: false, follow: true } };
  }

  const description = metaDescription(article.excerpt ?? article.body);
  const url = absoluteUrl(`/articles/${article.slug}`);

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
    },
    twitter: { card: 'summary_large_image', title: article.title, description },
  };
}

// A single civic-library article.
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleServer(slug);

  if (!article) notFound();

  const url = absoluteUrl(`/articles/${article.slug}`);

  return (
    <PageChrome>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: metaDescription(article.excerpt ?? article.body),
          datePublished: article.publishedAt ?? article.createdAt,
          dateModified: article.updatedAt,
          inLanguage: 'en-NG',
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          // Points at the Organization declared once in the root layout.
          publisher: { '@id': `${SITE_URL}/#organization` },
        }}
      />
      <ArticleView article={article} />
    </PageChrome>
  );
}
