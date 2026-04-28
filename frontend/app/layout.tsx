import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/jsonld';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Root metadata — locale-specific override'lar `app/tr/layout.tsx`'te yapılabilir.
 * `siteName`, default description ve sosyal imaj tüm sayfalara inherit olur.
 *
 * Yeni eklenenler (ADIM 18):
 *  - `keywords` — genel marka anahtar kelimeleri
 *  - `twitter` card yapılandırması
 *  - `icons` (favicon varyantları) — mevcut değillerse de tanım var
 *  - Open Graph default image
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Krontech — Privileged Access & Telemetry Pipeline',
    template: '%s · Krontech',
  },
  description:
    'Kron Telemetry Pipeline and Privileged Access Management solutions for enterprise security.',
  keywords: [
    'Krontech',
    'Kron',
    'Privileged Access Management',
    'PAM',
    'Zero Trust',
    'Telemetry Pipeline',
    'Single Connect',
    'Double Octopus',
    'enterprise security',
  ],
  applicationName: 'Krontech',
  authors: [{ name: 'Krontech', url: siteUrl }],
  creator: 'Krontech',
  publisher: 'Krontech',
  referrer: 'origin-when-cross-origin',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Krontech',
    title: 'Krontech — Privileged Access & Telemetry Pipeline',
    description:
      'Kron Telemetry Pipeline and Privileged Access Management solutions for enterprise security.',
    url: siteUrl,
    locale: 'en_US',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Krontech',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Krontech — Privileged Access & Telemetry Pipeline',
    description:
      'Enterprise-grade Privileged Access Management & Telemetry Pipeline.',
    site: '@krontech',
    creator: '@krontech',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1628' },
  ],
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <JsonLd
          data={[buildOrganizationJsonLd(siteUrl), buildWebsiteJsonLd(siteUrl)]}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
