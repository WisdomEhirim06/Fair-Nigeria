import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

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
  title: 'Fair Nigeria — Show up. Then watch every vote get counted.',
  description:
    'A citizen-led record of the 2027 Nigerian election that anyone can verify: civic knowledge, LGA ratings, and results you can trace, sheet by sheet.',
  openGraph: {
    title: 'Fair Nigeria',
    description:
      'A citizen-led record of the 2027 Nigerian election that anyone can verify — civic knowledge, LGA ratings, and traceable results.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#fbfaf6',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
