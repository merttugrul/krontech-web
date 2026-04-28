'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteProduct,
  listProducts,
  publishProduct,
  unpublishProduct,
  type ListProductsParams,
} from '@/lib/admin/api-products';
import type { AdminProductListItem, ContentStatus, ProductKind } from '@/lib/admin/types';
import { DataTable, AdminPagination, type ColumnDef } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

function kindLabel(kind: ProductKind): string {
  return kind === 'solution' ? 'Çözüm' : 'Ürün';
}

export function ProductsList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminProductListItem | null>(null);

  const qc = useQueryClient();

  const params: ListProductsParams = {
    page,
    pageSize: PAGE_SIZE,
    status,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => listProducts(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'products'] });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishProduct(id),
    onSuccess: invalidate,
  });
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => unpublishProduct(id),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<AdminProductListItem>[] = [
    {
      key: 'title',
      header: 'Başlık',
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/products/${row.id}` as never}
            className="font-medium text-kron-navy hover:text-kron-blue"
          >
            {row.title || <em className="text-kron-gray">(başlıksız)</em>}
          </Link>
          <p className="mt-0.5 truncate text-xs text-kron-gray">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'kind',
      header: 'Tür',
      width: '100px',
      render: (row) => (
        <span className="text-xs text-gray-700">{kindLabel(row.kind ?? 'product')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      width: '140px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'order',
      header: 'Sıra',
      width: '70px',
      align: 'center',
      render: (row) => <span className="text-xs text-gray-700">{row.order}</span>,
    },
    {
      key: 'updatedAt',
      header: 'Güncellendi',
      width: '140px',
      render: (row) => (
        <span className="text-xs text-gray-700">{formatDate(row.updatedAt, 'en')}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '200px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          {row.status === 'published' ? (
            <button
              type="button"
              onClick={() => unpublishMutation.mutate(row.id)}
              disabled={unpublishMutation.isPending}
              className="btn-ghost text-xs"
            >
              Taslağa çek
            </button>
          ) : (
            <button
              type="button"
              onClick={() => publishMutation.mutate(row.id)}
              disabled={publishMutation.isPending}
              className="btn-ghost text-xs text-emerald-700"
            >
              Yayına al
            </button>
          )}
          <Link
            href={`/admin/products/${row.id}` as never}
            className="btn-ghost text-xs"
          >
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
          <h1 className="text-2xl font-bold text-kron-navy">Ürünler &amp; Çözümler</h1>
          <p className="mt-1 text-sm text-kron-gray">
            Marketing sitesindeki ürün sayfalarını yönet.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-sm">
          + Yeni ürün
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-kron-light bg-white p-3 shadow-sm">
        <input
          type="search"
          placeholder="Ara (slug veya başlık)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 rounded-md border border-kron-light bg-white px-3 py-1.5 text-sm outline-none focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
        />
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

      <DataTable<AdminProductListItem>
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Henüz ürün yok. + Yeni ürün butonuyla ekle."
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
        title="Ürünü sil"
        description={
          <>
            <p className="mb-2">
              <strong>{deleteTarget?.title ?? deleteTarget?.slug}</strong> kalıcı olarak
              silinecek. Bu işlem geri alınamaz.
            </p>
            <p>İlişkili translations ve testimonial&apos;lar da silinir.</p>
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
