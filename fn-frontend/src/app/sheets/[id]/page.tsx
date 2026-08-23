import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { SheetDetail } from '@/components/sheets/SheetDetail';
import {
  getSheetResultServer,
  getSheetServer,
  resolveSheetPlace,
} from '@/lib/api/public-server';
import type { Sheet, SheetResult } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';
import { SITE_NAME, absoluteUrl, metaDescription } from '@/lib/seo/site';

type Props = { params: Promise<{ id: string }> };

/** A status-aware meta description, unique enough per sheet to avoid the ~176k
 *  near-duplicate pages all competing on one generic title. */
function sheetDescription(sheet: Sheet, result: SheetResult | null, place: string): string {
  const where = place ? ` in ${place}` : '';
  const base = `Result sheet for polling unit ${sheet.puCode}${where}.`;
  if (sheet.status === 'verified' && result) {
    const top = result.partyVotes
      .slice()
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3)
      .map((p) => `${p.abbreviation} ${formatNumber(p.votes)}`)
      .join(', ');
    return metaDescription(
      `${base} Agreed by ${result.agreedReadings} independent transcribers.${
        top ? ` Figures: ${top}.` : ''
      }`,
    );
  }
  if (sheet.status === 'disputed') {
    return metaDescription(`${base} Held back because transcribers disagreed on the figures.`);
  }
  return metaDescription(`${base} Awaiting agreement from independent transcribers.`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sheet = await getSheetServer(id);

  if (!sheet) {
    return { title: 'Result sheet', robots: { index: false, follow: true } };
  }

  const [result, place] = await Promise.all([
    getSheetResultServer(id),
    resolveSheetPlace(sheet),
  ]);

  const title = `Result sheet ${sheet.puCode}${place ? ` — ${place}` : ''}`;
  const description = sheetDescription(sheet, result, place);
  const url = absoluteUrl(`/sheets/${id}`);
  const imageUrl = sheet.thumbUrl ?? sheet.fileUrl;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

// A single result sheet: the paper, its fingerprint, and the figures read from it.
export default async function SheetPage({ params }: Props) {
  const { id } = await params;
  const sheet = await getSheetServer(id);

  const result = sheet ? await getSheetResultServer(id) : null;
  const place = sheet ? await resolveSheetPlace(sheet) : '';

  return (
    <PageChrome>
      {sheet ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'The paper trail',
                item: absoluteUrl('/sheets'),
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: `Result sheet ${sheet.puCode}`,
                item: absoluteUrl(`/sheets/${id}`),
              },
            ],
          }}
        />
      ) : null}
      <SheetDetail initial={{ sheet, result, place }} />
    </PageChrome>
  );
}
