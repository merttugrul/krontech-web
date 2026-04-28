'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteUser, listUsers } from '@/lib/admin/api-users';
import type { AdminUserAccount } from '@/lib/admin/types';
import { getCachedUser } from '@/lib/admin/session';
import { DataTable, type ColumnDef } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export function UsersList() {
  const me = getCachedUser();
  const [deleteTarget, setDeleteTarget] = useState<AdminUserAccount | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: listUsers,
    enabled: me?.role === 'admin',
  });

  const rows = data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<AdminUserAccount>[] = [
    {
      key: 'email',
      header: 'E-posta',
      render: (row) => (
        <div>
          <Link
            href={`/admin/users/${row.id}` as never}
            className="font-medium text-kron-navy hover:text-kron-blue"
          >
            {row.email}
          </Link>
          {!row.isActive && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
              pasif
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      width: '100px',
      render: (row) => (
        <span className="text-xs capitalize text-gray-700">{row.role}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Oluşturuldu',
      width: '130px',
      render: (row) => (
        <span className="text-xs text-gray-700">{formatDate(row.createdAt, 'en')}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/users/${row.id}` as never} className="btn-ghost text-xs">
            Düzenle
          </Link>
          {me?.id !== row.id && (
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="btn-ghost text-xs text-red-600 hover:bg-red-50"
            >
              Sil
            </button>
          )}
        </div>
      ),
    },
  ];

  if (me?.role !== 'admin') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Kullanıcı yönetimi yalnızca admin rolüne açıktır.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-kron-gray">Admin panel erişimi (JWT).</p>
        </div>
        <Link href="/admin/users/new" className="btn-primary text-sm">
          + Yeni kullanıcı
        </Link>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, 'Liste yüklenemedi.')}
        </div>
      )}

      <DataTable<AdminUserAccount>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Kullanıcı yok."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Kullanıcıyı sil"
        description={<>Bu kullanıcı kalıcı olarak silinir.</>}
        confirmLabel="Sil"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
