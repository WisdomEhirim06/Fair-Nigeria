import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { PublicDashboard } from '@/components/dashboard/PublicDashboard';

export const metadata: Metadata = {
  title: 'Results and ratings',
  description:
    'The 2027 Nigerian election as citizens recorded it: figures agreed by independent transcribers, traceable to the polling-unit sheet they came from, alongside how voters rated their own LGA.',
  alternates: { canonical: '/results' },
};

// Public results + ratings dashboard. Signed-in people get their app shell here,
// so their console is always one tap away.
export default function ResultsPage() {
  return (
    <PageChrome>
      <PublicDashboard />
    </PageChrome>
  );
}
