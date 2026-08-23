import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { SheetsBrowser } from '@/components/sheets/SheetsBrowser';
import { getStatesServer, listSheetsServer } from '@/lib/api/public-server';
import { absoluteUrl } from '@/lib/seo/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'The paper trail',
  description:
    'Every EC8A result sheet behind the count, as photographed at the polling unit. Each one carries a fingerprint taken on arrival, so you can check the paper matches the figures.',
  alternates: { canonical: absoluteUrl('/sheets') },
};

// Public paper trail — browse the EC8A sheets behind the count. The first page
// is server-rendered; the client owns filters and pagination from there.
export default async function SheetsPage() {
  const [states, sheets] = await Promise.all([
    getStatesServer(),
    listSheetsServer({ page: 1, limit: 24 }),
  ]);

  return (
    <PageChrome>
      <SheetsBrowser initial={{ states, sheets }} />
    </PageChrome>
  );
}
