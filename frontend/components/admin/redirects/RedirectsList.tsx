'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRedirect, listRedirects, type ListRedirectsParams } from '@/lib/admin/api-redirects';
import type { AdminRedirect } from '@/lib/admin/types';
import { DataTable, AdminPagination, type ColumnDef } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 30;

export function RedirectsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [deleteTarget, setDeleteTarget] = useState<AdminRedirect | null>(null);
  const qc = useQueryClient();

  const params: ListRedirectsParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(activeFilter === 'all' ? {} : { isActive: activeFilter === 'true' }),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'redirects', params],
    queryFn: () => listRedirects(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'redirects'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRedirect(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<AdminRedirect>[] = [
    {
      key: 'from',
      header: 'Kaynak',
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/redirects/${row.id}` as never}
            className="font-mono text-sm font-medium text-kron-navy hover:text-kron-blue"
          >
            {row.fromPath}
          </Link>
          <p className="mt-0.5 truncate text-xs text-gray-700">→ {row.toPath}</p>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Kod',
      width: '72px',
      align: 'center',
      render: (row) => <span className="text-xs font-mono">{row.statusCode}</span>,
    },
    {
      key: 'active',
      header: 'Aktif',
      width: '80px',
      render: (row) => (
        <span className={row.isActive ? 'text-emerald-700' : 'text-gray-700'}>
          {row.isActive ? 'Evet' : 'Hayır'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Güncellendi',
      width: '130px',
      render: (row) => (
        <span className="text-xs text-gray-700">{formatDate(row.updatedAt, 'en')}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/redirects/${row.id}` as never} className="btn-ghost text-xs">
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
          <h1 className="text-2xl font-bold text-kron-navy">Yönlendirmeler</h1>
          <p className="mt-1 text-sm text-kron-gray">Middleware ve edge cache ile eşleşen path kuralları.</p>
        </div>
        <Link href="/admin/redirects/new" className="btn-primary text-sm">
          + Yeni redirect
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-kron-light bg-white p-3 shadow-sm">
        <input
          type="search"
          placeholder="fromPath / toPath ara"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1 rounded-md border border-kron-light bg-white px-3 py-1.5 text-sm outline-none focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
        />
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as 'all' | 'true' | 'false');
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2.5 py-1.5 text-sm outline-none focus:border-kron-blue"
        >
          <option value="all">Tümü</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, 'Liste yüklenemedi.')}
        </div>
      )}

      <DataTable<AdminRedirect>
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Redirect yok."
      />

      {data && (
        <AdminPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Redirect sil"
        description={
          <>
            <span className="font-mono">{deleteTarget?.fromPath}</span> kuralı silinecek.
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
