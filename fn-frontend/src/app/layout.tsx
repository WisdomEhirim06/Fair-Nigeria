import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { PwaLayer } from '@/components/pwa/PwaLayer';
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
  title: 'Fair Nigeria',
  description:
    'A citizen-led record of the 2027 Nigerian election that anyone can verify: civic knowledge, LGA ratings, and results you can trace, sheet by sheet.',
  openGraph: {
    title: 'Fair Nigeria',
    description:
      'A citizen-led record of the 2027 Nigerian election that anyone can verify: civic knowledge, LGA ratings, and traceable results.',
    type: 'website',
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
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
