import type { Metadata } from 'next';
import { ResourceEditPage } from '@/components/admin/resources/ResourceEditPage';

export const metadata: Metadata = { title: 'Kaynak Düzenle' };

export default function AdminResourceEditPage({ params }: { params: { id: string } }) {
  return <ResourceEditPage id={params.id} />;
}
