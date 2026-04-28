'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteResource, listResources, type ListResourcesParams } from '@/lib/admin/api-resources';
import type { AdminResource, ContentStatus, ResourceType } from '@/lib/admin/types';
import { DataTable, AdminPagination, type ColumnDef } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<ResourceType, string> = {
  datasheet: 'Datasheet',
  casestudy: 'Case study',
  whitepaper: 'Whitepaper',
};

export function ResourcesList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [type, setType] = useState<ResourceType | 'all'>('all');
  const [locale, setLocale] = useState<'all' | 'en' | 'tr'>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminResource | null>(null);

  const qc = useQueryClient();

  const params: ListResourcesParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(status !== 'all' ? { status } : {}),
    ...(type !== 'all' ? { type } : {}),
    ...(locale !== 'all' ? { locale } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'resources', params],
    queryFn: () => listResources(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'resources'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<AdminResource>[] = [
    {
      key: 'title',
      header: 'Başlık',
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/resources/${row.id}` as never}
            className="font-medium text-kron-navy hover:text-kron-blue"
          >
            {row.title}
          </Link>
          <p className="mt-0.5 text-xs text-kron-gray">
            {TYPE_LABEL[row.type]} · {row.locale.toUpperCase()}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      width: '120px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'order',
      header: 'Sıra',
      width: '64px',
      align: 'center',
      render: (row) => <span className="text-xs text-gray-700">{row.order}</span>,
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
      width: '160px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/resources/${row.id}` as never} className="btn-ghost text-xs">
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
          <h1 className="text-2xl font-bold text-kron-navy">Kaynaklar</h1>
          <p className="mt-1 text-sm text-kron-gray">
            Datasheet, case study ve whitepaper dosyaları.
          </p>
        </div>
        <Link href="/admin/resources/new" className="btn-primary text-sm">
          + Yeni kaynak
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-kron-light bg-white p-3 shadow-sm">
        <input
          type="search"
          placeholder="Başlıkta ara"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[180px] flex-1 rounded-md border border-kron-light bg-white px-3 py-1.5 text-sm outline-none focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as ResourceType | 'all');
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2.5 py-1.5 text-sm outline-none focus:border-kron-blue"
        >
          <option value="all">Tüm tipler</option>
          <option value="datasheet">Datasheet</option>
          <option value="casestudy">Case study</option>
          <option value="whitepaper">Whitepaper</option>
        </select>
        <select
          value={locale}
          onChange={(e) => {
            setLocale(e.target.value as 'all' | 'en' | 'tr');
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2.5 py-1.5 text-sm outline-none focus:border-kron-blue"
        >
          <option value="all">Tüm diller</option>
          <option value="en">EN</option>
          <option value="tr">TR</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ContentStatus | 'all');
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2.5 py-1.5 text-sm outline-none focus:border-kron-blue"
        >
          <option value="all">Tüm durumlar</option>
          <option value="draft">Taslak</option>
          <option value="published">Yayında</option>
          <option value="scheduled">Planlı</option>
        </select>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, 'Liste yüklenemedi.')}
        </div>
      )}

      <DataTable<AdminResource>
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Kaynak yok. + Yeni kaynak ile ekleyin."
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
        title="Kaynağı sil"
        description={
          <>
            <strong>{deleteTarget?.title}</strong> kalıcı olarak silinecek.
          </>
        }
        confirmLabel="Evet, sil"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
