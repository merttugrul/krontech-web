'use client';

import { useQuery } from '@tanstack/react-query';
import { getResource } from '@/lib/admin/api-resources';
import { ResourceForm } from './ResourceForm';
import { getApiErrorMessage } from '@/lib/api';

export function ResourceEditPage({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'resources', id],
    queryFn: () => getResource(id),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-kron-gray">Yükleniyor…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Kaynak bulunamadı.')}
      </div>
    );
  }

  return <ResourceForm mode="edit" initial={data} />;
}
