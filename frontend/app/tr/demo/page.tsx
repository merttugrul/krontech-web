import type { Metadata } from 'next';
import { DemoPage } from '@/components/sections/contact/DemoPage';
import { getDictionary } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Demo Talebi · Krontech',
  description: getDictionary('tr').contact.demoSubtitle,
  alternates: {
    canonical: '/tr/demo',
    languages: { en: '/demo', tr: '/tr/demo' },
  },
  openGraph: {
    title: 'Demo Talebi · Krontech',
    description: getDictionary('tr').contact.demoSubtitle,
    url: '/tr/demo',
    locale: 'tr_TR',
  },
};

export default function Page() {
  return <DemoPage locale="tr" />;
}
