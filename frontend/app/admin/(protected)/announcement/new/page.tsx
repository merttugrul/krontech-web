import type { Metadata } from 'next';
import { AnnouncementForm } from '@/components/admin/announcement/AnnouncementForm';

export const metadata: Metadata = { title: 'Yeni Duyuru' };

export default function AdminAnnouncementNewPage() {
  return <AnnouncementForm mode="create" />;
}
