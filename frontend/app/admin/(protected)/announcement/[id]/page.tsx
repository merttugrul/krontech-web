import type { Metadata } from 'next';
import { AnnouncementEditPage } from '@/components/admin/announcement/AnnouncementEditPage';

export const metadata: Metadata = { title: 'Duyuru Düzenle' };

export default function AdminAnnouncementEditPage({ params }: { params: { id: string } }) {
  return <AnnouncementEditPage id={params.id} />;
}
