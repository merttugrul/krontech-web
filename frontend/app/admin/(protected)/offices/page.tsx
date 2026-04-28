import type { Metadata } from 'next';
import { OfficesList } from '@/components/admin/offices/OfficesList';

export const metadata: Metadata = { title: 'Ofisler' };

export default function AdminOfficesPage() {
  return <OfficesList />;
}
