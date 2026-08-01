import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { PwaLayer } from '@/components/pwa/PwaLayer';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/seo/site';
import { SessionProvider } from '@/lib/session/SessionProvider';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jb-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  // Without this, every relative OG image URL resolves against localhost and
  // social previews render blank. It has to be an absolute origin.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — verify the 2027 Nigerian election`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — verify the 2027 Nigerian election`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — verify the 2027 Nigerian election`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Let Google show full-size sheet thumbnails and longer snippets; the
      // whole point is that the evidence is public.
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  applicationName: 'Fair Nigeria',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Fair Nigeria',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#fbfaf6',
  // Let the app paint into the notch area when installed.
  viewportFit: 'cover',
};

/**
 * Site-wide structured data. Declaring the Organization once, with a stable
 * `@id`, lets every article on the site reference it as publisher instead of
 * repeating the same block per page.
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icons/icon-192.png'),
        width: 192,
        height: 192,
      },
      areaServed: { '@type': 'Country', name: 'Nigeria' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { '@id': ORGANIZATION_ID },
      inLanguage: 'en-NG',
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <JsonLd data={siteGraph} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SessionProvider>{children}</SessionProvider>
        <PwaLayer />
        {/* Both no-op outside Vercel, so local dev is unaffected. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
