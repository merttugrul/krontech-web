import type { Metadata } from 'next';
import { RedirectEditPage } from '@/components/admin/redirects/RedirectEditPage';

export const metadata: Metadata = { title: 'Redirect Düzenle' };

export default function AdminRedirectEditPage({ params }: { params: { id: string } }) {
  return <RedirectEditPage id={params.id} />;
}
