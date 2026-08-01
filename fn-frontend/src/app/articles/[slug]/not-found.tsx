import { PageChrome } from '@/components/app/PageChrome';

// Shown when a slug doesn't resolve — an unpublished, renamed, or mistyped
// article. Keeps the same wording the client reader used to show inline.
export default function ArticleNotFound() {
  return (
    <PageChrome>
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
    </PageChrome>
  );
}
