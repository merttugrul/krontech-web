'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteMedia,
  listMedia,
  updateMediaAltText,
  uploadMediaFile,
  type ListMediaParams,
} from '@/lib/admin/api-media';
import type { AdminMedia } from '@/lib/admin/types';
import { getCachedUser } from '@/lib/admin/session';
import { AdminPagination } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 24;

export function MediaLibrary() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminMedia | null>(null);
  const [altEdit, setAltEdit] = useState<AdminMedia | null>(null);
  const [altDraft, setAltDraft] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const me = getCachedUser();
  const isAdmin = me?.role === 'admin';

  const params: ListMediaParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'media', params],
    queryFn: () => listMedia(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'media'] });

  const upload = useMutation({
    mutationFn: uploadMediaFile,
    onSuccess: () => {
      invalidate();
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const altSave = useMutation({
    mutationFn: ({ id, altText }: { id: string; altText: string }) =>
      updateMediaAltText(id, altText),
    onSuccess: () => {
      invalidate();
      setAltEdit(null);
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">Media Library</h1>
          <p className="mt-1 text-sm text-kron-gray">
            Yüklenen dosyalar — ürün, blog ve formlarda URL olarak kullanılır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-primary text-sm"
          >
            Dosya yükle
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload.mutate(f);
          e.target.value = '';
        }}
      />

      {upload.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(upload.error, 'Yükleme hatası.')}
        </div>
      )}
      {upload.isPending && (
        <p className="text-sm text-kron-gray">Yükleniyor…</p>
      )}

      <div className="rounded-xl border border-kron-light bg-white p-3 shadow-sm">
        <input
          type="search"
          placeholder="Dosya adı veya mime ara"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-md border border-kron-light bg-white px-3 py-1.5 text-sm outline-none focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
        />
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, 'Liste yüklenemedi.')}
        </div>
      )}

      <div
        className={cn(
          'grid gap-4',
          'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
        )}
      >
        {isLoading && !items.length
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-kron-light/80"
              />
            ))
          : items.map((m) => (
              <article
                key={m.id}
                className="flex flex-col overflow-hidden rounded-xl border border-kron-light bg-white shadow-sm"
              >
                <div className="relative aspect-square bg-kron-light/40">
                  {m.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url}
                      alt={m.altText ?? ''}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-3xl text-kron-gray">
                      PDF
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-xs font-medium text-kron-navy" title={m.originalName}>
                    {m.originalName}
                  </p>
                  <p className="text-[10px] text-kron-gray">
                    {m.mimeType} · {formatDate(m.createdAt, 'en')}
                  </p>
                  <input
                    type="url"
                    readOnly
                    value={m.url}
                    className="w-full truncate rounded border border-kron-light bg-kron-light/20 px-2 py-1 text-[10px]"
                    onFocus={(e) => e.target.select()}
                  />
                  <div className="mt-auto flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAltEdit(m);
                        setAltDraft(m.altText ?? '');
                      }}
                      className="btn-ghost text-[11px]"
                    >
                      Alt text
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(m)}
                        className="btn-ghost text-[11px] text-red-600 hover:bg-red-50"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
      </div>

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
        title="Medyayı sil"
        description="Dosya S3 ve veritabanından kaldırılır. Bağlantı veren içerikler kırık URL gösterebilir."
        confirmLabel="Sil"
        danger
        loading={del.isPending}
        onConfirm={() => deleteTarget && del.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!altEdit}
        title="Alt text (erişilebilirlik)"
        description={
          <div className="space-y-2">
            <p className="text-sm text-kron-dark">{altEdit?.originalName}</p>
            <textarea
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-kron-light px-2 py-1.5 text-sm"
              placeholder="Görsel açıklaması"
            />
          </div>
        }
        confirmLabel="Kaydet"
        loading={altSave.isPending}
        onConfirm={() =>
          altEdit && altSave.mutate({ id: altEdit.id, altText: altDraft })
        }
        onCancel={() => setAltEdit(null)}
      />
    </div>
  );
}
