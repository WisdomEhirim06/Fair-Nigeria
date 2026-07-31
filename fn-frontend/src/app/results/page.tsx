import { PageChrome } from '@/components/app/PageChrome';
import { PublicDashboard } from '@/components/dashboard/PublicDashboard';

// Public results + ratings dashboard. Signed-in people get their app shell here,
// so their console is always one tap away.
export default function ResultsPage() {
  return (
    <PageChrome>
      <PublicDashboard />
    </PageChrome>
  );
}
