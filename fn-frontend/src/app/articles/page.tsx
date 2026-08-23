import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { PublicLibrary } from '@/components/content/PublicLibrary';
import { listArticlesServer } from '@/lib/api/public-server';
import { absoluteUrl } from '@/lib/seo/site';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Civic library',
  description:
    'Plain-language guides to voting in Nigeria: your rights at the polling unit, how accreditation works, what malpractice looks like, and how to report it.',
  alternates: { canonical: absoluteUrl('/articles') },
};

// Public civic library. Signed-in people get their app shell; guests the public
// header. The list is server-rendered; the category chips stay client-side.
export default async function ArticlesPage() {
  const articles = await listArticlesServer();

  return (
    <PageChrome>
      <PublicLibrary initialArticles={articles} />
    </PageChrome>
  );
}
