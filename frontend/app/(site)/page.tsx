import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n';
import { HeroSection } from '@/components/sections/HeroSection';
import { ProductShowcase } from '@/components/sections/ProductShowcase';
import { ValueProps } from '@/components/sections/ValueProps';
import { LatestBlog } from '@/components/sections/LatestBlog';
import { CtaSection } from '@/components/sections/CtaSection';

/**
 * EN Home. Server component — tüm sections server-rendered.
 * Blog ve ürün section'ları `sfetch` ile cache tag'leri üzerinden
 * backend revalidate'iyle senkron.
 */
export const metadata: Metadata = {
  title: 'Krontech — Privileged Access & Telemetry Pipeline',
  description:
    'Kron unifies observability, audit and session control across your hybrid cloud.',
  alternates: {
    canonical: '/',
    languages: { en: '/', tr: '/tr' },
  },
  openGraph: {
    title: 'Krontech — Privileged Access & Telemetry Pipeline',
    description:
      'Kron unifies observability, audit and session control across your hybrid cloud.',
    url: '/',
    locale: 'en_US',
  },
};

export default async function HomePage() {
  const dict = getDictionary('en');
  return (
    <>
      <HeroSection locale="en" dict={dict} />
      <ProductShowcase locale="en" dict={dict} />
      <ValueProps dict={dict} />
      <LatestBlog locale="en" dict={dict} />
      <CtaSection locale="en" dict={dict} />
    </>
  );
}
