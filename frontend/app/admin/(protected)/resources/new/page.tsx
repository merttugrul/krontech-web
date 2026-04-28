import type { Metadata } from 'next';
import { ResourceForm } from '@/components/admin/resources/ResourceForm';

export const metadata: Metadata = { title: 'Yeni Kaynak' };

export default function AdminResourceNewPage() {
  return <ResourceForm mode="create" />;
}
