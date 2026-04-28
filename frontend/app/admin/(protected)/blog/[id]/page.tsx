import type { Metadata } from 'next';
import { BlogEditPage } from '@/components/admin/blog/BlogEditPage';

export const metadata: Metadata = { title: 'Blog Düzenle' };

export default function AdminBlogEditPage({ params }: { params: { id: string } }) {
  return <BlogEditPage id={params.id} />;
}
