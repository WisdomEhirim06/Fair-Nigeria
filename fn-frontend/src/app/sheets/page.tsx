import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { SheetsBrowser } from '@/components/sheets/SheetsBrowser';

export const metadata: Metadata = {
  title: 'The paper trail',
  description:
    'Every EC8A result sheet behind the count, as photographed at the polling unit. Each one carries a fingerprint taken on arrival, so you can check the paper matches the figures.',
  alternates: { canonical: '/sheets' },
};

// Public paper trail — browse the EC8A sheets behind the count.
export default function SheetsPage() {
  return (
    <PageChrome>
      <SheetsBrowser />
    </PageChrome>
  );
}
