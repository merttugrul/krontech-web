'use client';

import { useQuery } from '@tanstack/react-query';
import { getOffice } from '@/lib/admin/api-offices';
import { OfficeForm } from './OfficeForm';
import { getApiErrorMessage } from '@/lib/api';

export function OfficeEditPage({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'offices', id],
    queryFn: () => getOffice(id),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-kron-gray">Yükleniyor…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Ofis bulunamadı.')}
      </div>
    );
  }

  return <OfficeForm mode="edit" initial={data} />;
}
