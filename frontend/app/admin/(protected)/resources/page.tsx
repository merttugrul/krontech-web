import type { Metadata } from 'next';
import { ResourcesList } from '@/components/admin/resources/ResourcesList';

export const metadata: Metadata = { title: 'Kaynaklar' };

export default function AdminResourcesPage() {
  return <ResourcesList />;
}
