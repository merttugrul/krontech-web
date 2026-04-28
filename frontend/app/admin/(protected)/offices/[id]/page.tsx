import type { Metadata } from 'next';
import { OfficeEditPage } from '@/components/admin/offices/OfficeEditPage';

export const metadata: Metadata = { title: 'Ofis Düzenle' };

export default function AdminOfficeEditPage({ params }: { params: { id: string } }) {
  return <OfficeEditPage id={params.id} />;
}
