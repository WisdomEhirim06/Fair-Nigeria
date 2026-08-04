import { ImageResponse } from 'next/og';

import { getArticleServer } from '@/lib/api/public-server';
import { categoryLabel } from '@/components/content/categories';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';


export default async function ArticleOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleServer(slug);

  const title = article?.title ?? 'Fair Nigeria';
  const category = article ? categoryLabel(article.category) : 'Civic library';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          backgroundColor: '#12251b',
          color: '#fbfaf6',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#8fd14f',
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: '#8fd14f' }} />
          {category}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 60 ? 56 : 68,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            maxWidth: 980,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 26,
            fontWeight: 600,
            color: '#cdd6c4',
          }}
        >
          <span>Fair Nigeria</span>
          <span style={{ fontSize: 20, color: '#9fad95' }}>Citizen-led electoral transparency</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
