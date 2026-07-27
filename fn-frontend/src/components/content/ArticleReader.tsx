'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getArticle, type Article } from '@/lib/api';
import { categoryLabel } from './categories';
import { Markdown } from './Markdown';
import { ShareBar } from './ShareBar';

export function ArticleReader() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
    void getArticle(slug)
      .then(setArticle)
      .catch(() => setArticle(null));
  }, [slug]);

  if (article === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-lime motion-reduce:animate-none"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (article === null) {
    return (
      <div className="mx-auto w-full max-w-[680px] px-6 py-24 text-center">
        <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">Article not found</h1>
        <p className="mt-3 text-[0.95rem] text-muted">
          This guide may have moved or been unpublished.
        </p>
        <a
          href="/articles"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-[0.88rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
        >
          Back to the library
        </a>
      </div>
    );
  }

  return (
    <article className="mx-auto w-full max-w-[680px] px-6 pb-24">
      <a
        href="/articles"
        className="mt-8 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-muted transition-colors hover:text-ink sm:mt-12"
      >
        <span aria-hidden>←</span> Civic library
      </a>

      <header className="mt-6 border-b border-ink/10 pb-8">
        <span className="inline-flex items-center rounded-full bg-lime/15 px-3 py-1 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-leaf">
          {categoryLabel(article.category)}
        </span>
        <h1 className="mt-4 text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em] [text-wrap:balance]">
          {article.title}
        </h1>
        {article.excerpt ? (
          <p className="mt-4 text-[1.1rem] leading-relaxed text-muted">{article.excerpt}</p>
        ) : null}
      </header>

      <Markdown source={article.body} className="mt-2" />

      <ShareBar title={article.title} excerpt={article.excerpt} />
    </article>
  );
}
