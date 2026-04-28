import type { Metadata } from 'next';
import { ContactPage } from '@/components/sections/contact/ContactPage';
import { getDictionary } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'İletişim · Krontech',
  description: getDictionary('tr').contact.contactSubtitle,
  alternates: {
    canonical: '/tr/contact',
    languages: { en: '/contact', tr: '/tr/contact' },
  },
  openGraph: {
    title: 'İletişim · Krontech',
    description: getDictionary('tr').contact.contactSubtitle,
    url: '/tr/contact',
    locale: 'tr_TR',
  },
};

export default function Page() {
  return <ContactPage locale="tr" />;
}
