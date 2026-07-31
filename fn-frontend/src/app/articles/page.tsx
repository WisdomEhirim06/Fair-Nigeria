import { PageChrome } from '@/components/app/PageChrome';
import { PublicLibrary } from '@/components/content/PublicLibrary';

// Public civic library. Signed-in people get their app shell; guests the public header.
export default function ArticlesPage() {
  return (
    <PageChrome>
      <PublicLibrary />
    </PageChrome>
  );
}
