'use client';

import { useEffect, useMemo, useState } from 'react';

import { listArticles, type ArticleCategory, type ArticleSummary } from '@/lib/api';
import { CATEGORY_ORDER, categoryLabel } from './categories';

export function PublicLibrary() {
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [active, setActive] = useState<ArticleCategory | 'all'>('all');

  useEffect(() => {
    void listArticles()
      .then(setArticles)
      .catch(() => setArticles([]));
  }, []);

  // Only show category chips that actually have published articles.
  const available = useMemo(() => {
    const present = new Set((articles ?? []).map((a) => a.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [articles]);

  const shown = useMemo(
    () => (active === 'all' ? articles ?? [] : (articles ?? []).filter((a) => a.category === active)),
    [articles, active],
  );

  return (
    <div className="mx-auto w-full max-w-[860px] px-6 pb-24">
      {/* Hero */}
      <section className="pt-10 sm:pt-14">
        <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-leaf">
          Civic library
        </p>
        <h1 className="mt-3 text-[clamp(2rem,6vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          Know your power <span className="text-lime">before you vote.</span>
        </h1>
        <p className="mt-4 max-w-[54ch] text-[1.02rem] leading-relaxed text-muted">
          Plain-English guides to your rights, how accreditation works, what counts as malpractice,
          and how to report it.
        </p>
      </section>

      {/* Category filter */}
      {available.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          <Chip label="All" active={active === 'all'} onClick={() => setActive('all')} />
          {available.map((c) => (
            <Chip
              key={c}
              label={categoryLabel(c)}
              active={active === c}
              onClick={() => setActive(c)}
            />
          ))}
        </div>
      ) : null}

      {/* Articles */}
      <div className="mt-8">
        {articles === null ? (
          <div className="flex justify-center py-16">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-lime motion-reduce:animate-none"
              role="status"
              aria-label="Loading"
            />
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/50 px-6 py-16 text-center">
            <p className="text-[1rem] font-semibold">Nothing here yet</p>
            <p className="mx-auto mt-1.5 max-w-[40ch] text-[0.9rem] text-muted">
              Guides are on the way. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-[0.85rem] font-semibold transition-colors ${
        active
          ? 'bg-lime text-ink'
          : 'border border-ink/15 text-ink/65 hover:border-lime hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <a href={`/articles/${article.slug}`} className="group block">
      <article className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-6 transition-all group-hover:-translate-y-0.5 group-hover:border-lime/60 group-hover:shadow-[0_16px_36px_rgba(15,31,23,0.08)]">
        <span className="inline-flex w-fit items-center rounded-full bg-lime/15 px-2.5 py-1 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-leaf">
          {categoryLabel(article.category)}
        </span>
        <h2 className="mt-3 text-[1.2rem] font-bold leading-snug tracking-[-0.01em]">
          {article.title}
        </h2>
        {article.excerpt ? (
          <p className="mt-2 line-clamp-3 text-[0.92rem] leading-relaxed text-muted">
            {article.excerpt}
          </p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-1.5 pt-1 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/50 transition-colors group-hover:text-lime">
          Read <span aria-hidden>→</span>
        </span>
      </article>
    </a>
  );
}
