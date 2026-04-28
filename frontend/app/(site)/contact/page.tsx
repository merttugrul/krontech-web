import type { Metadata } from 'next';
import { ContactPage } from '@/components/sections/contact/ContactPage';
import { getDictionary } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Contact · Krontech',
  description: getDictionary('en').contact.contactSubtitle,
  alternates: {
    canonical: '/contact',
    languages: { en: '/contact', tr: '/tr/contact' },
  },
  openGraph: {
    title: 'Contact · Krontech',
    description: getDictionary('en').contact.contactSubtitle,
    url: '/contact',
    locale: 'en_US',
  },
};

export default function Page() {
  return <ContactPage locale="en" />;
}
