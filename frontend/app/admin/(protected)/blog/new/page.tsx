import type { Metadata } from 'next';
import { BlogCreatePage } from '@/components/admin/blog/BlogCreatePage';

export const metadata: Metadata = { title: 'Yeni Blog' };

export default function AdminBlogNewPage() {
  return <BlogCreatePage />;
}
