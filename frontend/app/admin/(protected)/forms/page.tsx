import type { Metadata } from 'next';
import { FormsList } from '@/components/admin/forms/FormsList';

export const metadata: Metadata = { title: 'Form Gönderileri' };

export default function AdminFormsPage() {
  return <FormsList />;
}
