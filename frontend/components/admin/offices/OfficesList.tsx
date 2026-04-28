'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOffice, listOffices } from '@/lib/admin/api-offices';
import type { AdminOffice } from '@/lib/admin/types';
import { DataTable, type ColumnDef } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';

export function OfficesList() {
  const [deleteTarget, setDeleteTarget] = useState<AdminOffice | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'offices'],
    queryFn: listOffices,
  });

  const rows = data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOffice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offices'] });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<AdminOffice>[] = [
    {
      key: 'city',
      header: 'Şehir',
      render: (row) => (
        <div>
          <Link
            href={`/admin/offices/${row.id}` as never}
            className="font-medium text-kron-navy hover:text-kron-blue"
          >
            {row.city}
          </Link>
          <p className="text-xs text-kron-gray">
            {row.locale.toUpperCase()} · sıra {row.order}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'İletişim',
      render: (row) => (
        <div className="text-xs text-gray-700">
          <div>{row.email}</div>
          <div>{row.phone}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/offices/${row.id}` as never} className="btn-ghost text-xs">
            Düzenle
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="btn-ghost text-xs text-red-600 hover:bg-red-50"
          >
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">Ofisler</h1>
          <p className="mt-1 text-sm text-kron-gray">Footer ve iletişim blokları.</p>
        </div>
        <Link href="/admin/offices/new" className="btn-primary text-sm">
          + Yeni ofis
        </Link>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, 'Liste yüklenemedi.')}
        </div>
      )}

      <DataTable<AdminOffice>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Ofis kaydı yok."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ofisi sil"
        description={
          <>
            <strong>{deleteTarget?.city}</strong> silinecek.
          </>
        }
        confirmLabel="Sil"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
