import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { PublicLibrary } from '@/components/content/PublicLibrary';

export const metadata: Metadata = {
  title: 'Civic library',
  description:
    'Plain-language guides to voting in Nigeria: your rights at the polling unit, how accreditation works, what malpractice looks like, and how to report it.',
  alternates: { canonical: '/articles' },
};

// Public civic library. Signed-in people get their app shell; guests the public header.
export default function ArticlesPage() {
  return (
    <PageChrome>
      <PublicLibrary />
    </PageChrome>
  );
}
