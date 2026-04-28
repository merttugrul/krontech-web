'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteBlogPost,
  listBlogPosts,
  publishBlogPost,
  unpublishBlogPost,
  type ListBlogParams,
} from '@/lib/admin/api-blog';
import type { AdminBlogListItem, ContentStatus } from '@/lib/admin/types';
import type { PostType } from '@/lib/types';
import { DataTable, AdminPagination, type ColumnDef } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function BlogList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [type, setType] = useState<PostType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogListItem | null>(null);
  const qc = useQueryClient();

  const params: ListBlogParams = {
    page,
    pageSize: PAGE_SIZE,
    status,
    type,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'blog', params],
    queryFn: () => listBlogPosts(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'blog'] });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishBlogPost(id),
    onSuccess: invalidate,
  });
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => unpublishBlogPost(id),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<AdminBlogListItem>[] = [
    {
      key: 'title',
      header: 'Başlık',
      render: (row) => (
        <div className="flex min-w-0 items-start gap-3">
          {row.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.coverImage}
              alt=""
              className="h-10 w-14 flex-shrink-0 rounded border border-kron-light object-cover"
            />
          )}
          <div className="min-w-0">
            <Link
              href={`/admin/blog/${row.id}` as never}
              className="font-medium text-kron-navy hover:text-kron-blue"
            >
              {row.title || <em className="text-kron-gray">(başlıksız)</em>}
            </Link>
            <p className="mt-0.5 truncate text-xs text-kron-gray">
              /{row.slug}
              {row.isHighlight && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                  Öne çıkan
                </span>
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      width: '90px',
      render: (row) => (
        <span
          className={
            row.type === 'news'
              ? 'rounded bg-kron-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-kron-accent'
              : 'rounded bg-kron-blue/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-kron-blue'
          }
        >
          {row.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      width: '130px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'views',
      header: 'Okunma',
      width: '80px',
      align: 'right',
      render: (row) => <span className="text-xs text-gray-700">{row.viewCount}</span>,
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
          <Link href={`/admin/blog/${row.id}` as never} className="btn-ghost text-xs">
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
          <h1 className="text-2xl font-bold text-kron-navy">Blog & Haberler</h1>
          <p className="mt-1 text-sm text-kron-gray">
            TipTap ile zengin içerik. Blog ve haber tek tabloda, `type` ile ayrılır.
          </p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary text-sm">
          + Yeni yazı
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-kron-light bg-white p-3 shadow-sm">
        <input
          type="search"
          placeholder="Ara"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 rounded-md border border-kron-light bg-white px-3 py-1.5 text-sm outline-none focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as PostType | 'all');
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2.5 py-1.5 text-sm outline-none focus:border-kron-blue"
        >
          <option value="all">Tüm tipler</option>
          <option value="blog">Blog</option>
          <option value="news">News</option>
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

      <DataTable<AdminBlogListItem>
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Henüz yazı yok."
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
        title="Yazıyı sil"
        description={
          <p>
            <strong>{deleteTarget?.title ?? deleteTarget?.slug}</strong> kalıcı olarak
            silinecek. Bu işlem geri alınamaz.
          </p>
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
