import type { Metadata } from 'next';
import { RedirectsList } from '@/components/admin/redirects/RedirectsList';

export const metadata: Metadata = { title: 'Redirects' };

export default function AdminRedirectsPage() {
  return <RedirectsList />;
}
