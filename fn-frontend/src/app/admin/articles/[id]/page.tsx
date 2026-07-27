'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getArticleById, type Article } from '@/lib/api';
import { ArticleEditor } from '@/components/admin/ArticleEditor';
import { EmptyState, Spinner, btnPrimary } from '@/components/admin/ui';

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
    void getArticleById(id)
      .then(setArticle)
      .catch(() => setArticle(null));
  }, [id]);

  if (article === undefined) return <Spinner />;
  if (article === null) {
    return (
      <EmptyState
        title="Article not found"
        action={
          <a href="/admin/articles" className={btnPrimary}>
            Back to articles
          </a>
        }
      />
    );
  }

  return <ArticleEditor article={article} />;
}
