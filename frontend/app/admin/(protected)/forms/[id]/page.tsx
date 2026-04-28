import type { Metadata } from 'next';
import { FormSubmissionDetail } from '@/components/admin/forms/FormSubmissionDetail';

export const metadata: Metadata = { title: 'Form Detayı' };

export default function AdminFormDetailPage({ params }: { params: { id: string } }) {
  return <FormSubmissionDetail id={params.id} />;
}
