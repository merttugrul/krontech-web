import type { Metadata } from 'next';
import { OfficeForm } from '@/components/admin/offices/OfficeForm';

export const metadata: Metadata = { title: 'Yeni Ofis' };

export default function AdminOfficeNewPage() {
  return <OfficeForm mode="create" />;
}
