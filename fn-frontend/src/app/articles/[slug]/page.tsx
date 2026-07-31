import { PageChrome } from '@/components/app/PageChrome';
import { ArticleReader } from '@/components/content/ArticleReader';

// A single civic-library article.
export default function ArticlePage() {
  return (
    <PageChrome>
      <ArticleReader />
    </PageChrome>
  );
}
