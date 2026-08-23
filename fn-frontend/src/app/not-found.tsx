import { PageChrome } from '@/components/app/PageChrome';

// Shown for any URL that doesn't resolve. Keeps the same wording the article
// not-found screen uses, so a lost visitor is never left with a blank page.
export default function NotFound() {
  return (
    <PageChrome>
      <div className="mx-auto w-full max-w-[680px] px-6 py-24 text-center">
        <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">Page not found</h1>
        <p className="mt-3 text-[0.95rem] text-muted">
          This page may have moved or been removed.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-[0.88rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
        >
          Back home
        </a>
      </div>
    </PageChrome>
  );
}
