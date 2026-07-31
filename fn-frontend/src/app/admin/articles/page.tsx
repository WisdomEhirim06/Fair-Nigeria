'use client';

import { useEffect, useState } from 'react';

import { listAllArticles, setArticlePublished, type ArticleSummary } from '@/lib/api';
import { categoryLabel } from '@/components/content/categories';
import { Badge, Card, EmptyState, PageHeading, Spinner, btnPrimary } from '@/components/admin/ui';
import { formatDate } from '@/components/admin/format';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);

  useEffect(() => {
    void listAllArticles()
      .then(setArticles)
      .catch(() => setArticles([]));
  }, []);

  return (
    <div>
      <PageHeading
        eyebrow="Civic library"
        title="Articles"
        description="Write and publish the plain-English guides citizens read."
        action={
          <a href="/admin/articles/new" className={btnPrimary}>
            + New article
          </a>
        }
      />

      {articles === null ? (
        <Spinner />
      ) : articles.length === 0 ? (
        <EmptyState
          title="No articles yet"
          body="Write your first civic guide — how accreditation works, what counts as malpractice, how to report it."
          action={
            <a href="/admin/articles/new" className={btnPrimary}>
              Write an article
            </a>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {articles.map((a) => (
            <ArticleRow
              key={a.id}
              article={a}
              onToggled={(u) => setArticles((prev) => (prev ?? []).map((x) => (x.id === u.id ? u : x)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleRow({
  article,
  onToggled,
}: {
  article: ArticleSummary;
  onToggled: (a: ArticleSummary) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      onToggled(await setArticlePublished(article.id, !article.isPublished));
    } catch {
      /* no-op; row keeps its current state */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex items-center justify-between gap-4 px-4 py-3.5">
      <a href={`/admin/articles/${article.id}`} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[0.95rem] font-semibold">{article.title}</span>
          <Badge tone={article.isPublished ? 'positive' : 'warning'}>
            {article.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.72rem] text-muted">
          <span>{categoryLabel(article.category)}</span>
          <span aria-hidden>·</span>
          <span>
            {article.isPublished && article.publishedAt
              ? `published ${formatDate(article.publishedAt)}`
              : `updated ${formatDate(article.updatedAt)}`}
          </span>
        </p>
      </a>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy}
          className="rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-leaf transition-colors hover:bg-lime/10 disabled:opacity-50"
        >
          {article.isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <a
          href={`/admin/articles/${article.id}`}
          className="rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-ink/70 transition-colors hover:bg-ink/[0.05] hover:text-ink"
        >
          Edit
        </a>
      </div>
    </Card>
  );
}
