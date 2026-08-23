import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Root fallback share image — used by every page without its own opengraph-image
// (homepage, results, sheets, audit). Matches the article OG style.
export default function OpengraphImage() {
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
            gap: 14,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#8fd14f',
          }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: '#8fd14f' }} />
          Fair Nigeria
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            Every vote, counted.
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            Every figure, a sheet.
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: '#cdd6c4',
              lineHeight: 1.3,
            }}
          >
            A citizen-led record of the 2027 Nigerian election that anyone can verify.
          </div>
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
