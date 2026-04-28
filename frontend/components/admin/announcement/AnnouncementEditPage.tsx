'use client';

import { useQuery } from '@tanstack/react-query';
import { getAnnouncement } from '@/lib/admin/api-announcement';
import { AnnouncementForm } from './AnnouncementForm';
import { getApiErrorMessage } from '@/lib/api';

export function AnnouncementEditPage({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'announcement-bar', id],
    queryFn: () => getAnnouncement(id),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-kron-gray">Yükleniyor…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Duyuru bulunamadı.')}
      </div>
    );
  }

  return <AnnouncementForm mode="edit" initial={data} />;
}
