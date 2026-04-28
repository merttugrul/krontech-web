'use client';

import { useQuery } from '@tanstack/react-query';
import { getBlogPost } from '@/lib/admin/api-blog';
import { getApiErrorMessage } from '@/lib/api';
import { BlogForm } from './BlogForm';

export function BlogEditPage({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'blog', id],
    queryFn: () => getBlogPost(id),
  });

  if (isLoading) {
    return <div className="grid min-h-[40vh] place-items-center text-kron-gray">Yükleniyor…</div>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Yazı bulunamadı.')}
      </div>
    );
  }

  return <BlogForm mode="edit" initial={data} />;
}
