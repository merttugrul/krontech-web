import type { Metadata } from 'next';
import { AnnouncementsList } from '@/components/admin/announcement/AnnouncementsList';

export const metadata: Metadata = { title: 'Duyuru Barı' };

export default function AdminAnnouncementPage() {
  return <AnnouncementsList />;
}
