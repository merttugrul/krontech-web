'use client';

import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/admin/api-users';
import { UserForm } from './UserForm';
import { getApiErrorMessage } from '@/lib/api';
import { getCachedUser } from '@/lib/admin/session';

export function UserEditPage({ id }: { id: string }) {
  const me = getCachedUser();
  const canLoad = me?.role === 'admin';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => getUser(id),
    enabled: canLoad,
  });

  if (!canLoad) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Bu sayfaya erişim yok.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-kron-gray">Yükleniyor…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Kullanıcı bulunamadı.')}
      </div>
    );
  }

  return <UserForm mode="edit" initial={data} />;
}
