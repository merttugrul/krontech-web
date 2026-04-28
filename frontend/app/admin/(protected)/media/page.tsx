import type { Metadata } from 'next';
import { MediaLibrary } from '@/components/admin/media/MediaLibrary';

export const metadata: Metadata = { title: 'Media Library' };

export default function AdminMediaPage() {
  return <MediaLibrary />;
}
