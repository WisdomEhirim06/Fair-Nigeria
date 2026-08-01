import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { SheetDetail } from '@/components/sheets/SheetDetail';
import { absoluteUrl } from '@/lib/seo/site';

type Props = { params: Promise<{ id: string }> };

// The sheet's own figures still load client-side, so the title stays generic —
// but the canonical has to be per-sheet, or every sheet page competes with
// every other one for the same URL in Google's index.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Result sheet',
    description:
      'One EC8A result sheet as photographed at the polling unit, with the fingerprint taken on arrival and the figures independent transcribers read from it.',
    alternates: { canonical: absoluteUrl(`/sheets/${id}`) },
  };
}

// A single result sheet: the paper, its fingerprint, and the figures read from it.
export default function SheetPage() {
  return (
    <PageChrome>
      <SheetDetail />
    </PageChrome>
  );
}
