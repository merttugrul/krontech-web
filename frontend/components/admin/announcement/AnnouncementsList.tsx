'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAnnouncement, listAnnouncements } from '@/lib/admin/api-announcement';
import type { AdminAnnouncementBar } from '@/lib/admin/types';
import { DataTable, type ColumnDef } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export function AnnouncementsList() {
  const [deleteTarget, setDeleteTarget] = useState<AdminAnnouncementBar | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'announcement-bar'],
    queryFn: listAnnouncements,
  });

  const rows = data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcement-bar'] });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<AdminAnnouncementBar>[] = [
    {
      key: 'text',
      header: 'Metin',
      render: (row) => (
        <div className="min-w-0 max-w-md">
          <Link
            href={`/admin/announcement/${row.id}` as never}
            className="line-clamp-2 font-medium text-kron-navy hover:text-kron-blue"
          >
            {row.text}
          </Link>
          <p className="mt-0.5 text-xs text-kron-gray">
            {row.locale.toUpperCase()}
            {row.linkUrl && ` · ${row.linkLabel ?? 'link'}`}
          </p>
        </div>
      ),
    },
    {
      key: 'window',
      header: 'Zaman penceresi',
      width: '200px',
      render: (row) => (
        <div className="text-xs text-gray-700">
          <div>{row.startDate ? formatDate(row.startDate, 'en') : '—'}</div>
          <div>{row.endDate ? formatDate(row.endDate, 'en') : '—'}</div>
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Aktif',
      width: '72px',
      render: (row) => (
        <span className={row.isActive ? 'text-emerald-700' : 'text-gray-700'}>
          {row.isActive ? 'Evet' : 'Hayır'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/announcement/${row.id}` as never} className="btn-ghost text-xs">
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
          <h1 className="text-2xl font-bold text-kron-navy">Duyuru barı</h1>
          <p className="mt-1 text-sm text-kron-gray">
            Site üst şeridi — dil, tarih aralığı ve link ile.
          </p>
        </div>
        <Link href="/admin/announcement/new" className="btn-primary text-sm">
          + Yeni duyuru
        </Link>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, 'Liste yüklenemedi.')}
        </div>
      )}

      <DataTable<AdminAnnouncementBar>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Henüz duyuru yok."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Duyuruyu sil"
        description={<>Bu duyuru kalıcı olarak silinecek.</>}
        confirmLabel="Sil"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
