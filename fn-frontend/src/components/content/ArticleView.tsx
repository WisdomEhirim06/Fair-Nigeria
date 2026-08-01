import type { Article } from '@/lib/api';
import { categoryLabel } from './categories';
import { Markdown } from './Markdown';
import { ShareBar } from './ShareBar';


export function ArticleView({ article }: { article: Article }) {
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
        {article.publishedAt ? (
          <p className="mt-4 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-muted">
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </p>
        ) : null}
      </header>

      <Markdown source={article.body} className="mt-2" />

      <ShareBar title={article.title} excerpt={article.excerpt} />
    </article>
  );
}
