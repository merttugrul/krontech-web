'use client';

import { useQuery } from '@tanstack/react-query';
import { getRedirect } from '@/lib/admin/api-redirects';
import { RedirectForm } from './RedirectForm';
import { getApiErrorMessage } from '@/lib/api';

export function RedirectEditPage({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'redirects', id],
    queryFn: () => getRedirect(id),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-kron-gray">Yükleniyor…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Redirect bulunamadı.')}
      </div>
    );
  }

  return <RedirectForm mode="edit" initial={data} />;
}
