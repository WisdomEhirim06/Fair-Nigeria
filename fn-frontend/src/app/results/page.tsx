import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { PublicDashboard } from '@/components/dashboard/PublicDashboard';
import {
  getCurrentElectionServer,
  getRatingsDashboardServer,
  getResultsDashboardServer,
} from '@/lib/api/public-server';
import { absoluteUrl } from '@/lib/seo/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Results and ratings',
  description:
    'The 2027 Nigerian election as citizens recorded it: figures agreed by independent transcribers, traceable to the polling-unit sheet they came from, alongside how voters rated their own LGA.',
  alternates: { canonical: absoluteUrl('/results') },
};

// Public results + ratings dashboard. Signed-in people get their app shell here,
// so their console is always one tap away. First paint is server-rendered; the
// client keeps polling the same endpoints every 60s.
export default async function ResultsPage() {
  const election = await getCurrentElectionServer();
  const results = election ? await getResultsDashboardServer(election.id) : null;
  const ratings = election ? await getRatingsDashboardServer(election.id) : null;

  return (
    <PageChrome>
      <PublicDashboard initialData={{ election, results, ratings }} />
    </PageChrome>
  );
}
