import type { Metadata } from 'next';
import { BlogList } from '@/components/admin/blog/BlogList';

export const metadata: Metadata = { title: 'Blog' };

export default function AdminBlogPage() {
  return <BlogList />;
}
