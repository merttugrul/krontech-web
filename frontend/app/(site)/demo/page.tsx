import type { Metadata } from 'next';
import { DemoPage } from '@/components/sections/contact/DemoPage';
import { getDictionary } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Request a demo · Krontech',
  description: getDictionary('en').contact.demoSubtitle,
  alternates: {
    canonical: '/demo',
    languages: { en: '/demo', tr: '/tr/demo' },
  },
  openGraph: {
    title: 'Request a demo · Krontech',
    description: getDictionary('en').contact.demoSubtitle,
    url: '/demo',
    locale: 'en_US',
  },
};

export default function Page() {
  return <DemoPage locale="en" />;
}
