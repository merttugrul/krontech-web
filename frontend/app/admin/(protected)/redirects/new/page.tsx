import type { Metadata } from 'next';
import { RedirectForm } from '@/components/admin/redirects/RedirectForm';

export const metadata: Metadata = { title: 'Yeni Redirect' };

export default function AdminRedirectNewPage() {
  return <RedirectForm mode="create" />;
}
