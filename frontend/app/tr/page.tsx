import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n';
import { HeroSection } from '@/components/sections/HeroSection';
import { ProductShowcase } from '@/components/sections/ProductShowcase';
import { ValueProps } from '@/components/sections/ValueProps';
import { LatestBlog } from '@/components/sections/LatestBlog';
import { CtaSection } from '@/components/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Krontech — Ayrıcalıklı Erişim & Telemetri Pipeline',
  description:
    'Kron; hibrit bulut ortamlarında gözlemlenebilirlik, denetim ve oturum kontrolünü tek platformda birleştirir.',
  alternates: {
    canonical: '/tr',
    languages: { en: '/', tr: '/tr' },
  },
  openGraph: {
    title: 'Krontech — Ayrıcalıklı Erişim & Telemetri Pipeline',
    description:
      'Kron; hibrit bulut ortamlarında gözlemlenebilirlik, denetim ve oturum kontrolünü tek platformda birleştirir.',
    url: '/tr',
    locale: 'tr_TR',
  },
};

export default async function HomePageTr() {
  const dict = getDictionary('tr');
  return (
    <>
      <HeroSection locale="tr" dict={dict} />
      <ProductShowcase locale="tr" dict={dict} />
      <ValueProps dict={dict} />
      <LatestBlog locale="tr" dict={dict} />
      <CtaSection locale="tr" dict={dict} />
    </>
  );
}
