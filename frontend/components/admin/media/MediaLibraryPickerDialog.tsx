'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listMedia } from '@/lib/admin/api-media';
import { AdminPagination } from '@/components/admin/DataTable';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 24;

export interface MediaLibraryPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** Dosyanın CDN / public URL'i */
  onSelect: (url: string) => void;
  /**
   * 'images' → yalnızca görsel MIME'leri (API: mimeType prefix `image/`).
   * 'all' → yüklemiş olduğun tüm dosyalar (PDF dahil).
   */
  libraryFilter?: 'images' | 'all';
}

/**
 * `/admin/media` ile aynı kaynaktan listeleyen seçim diyaloğu.
 * OG / kapak için genelde görseller; dosya URL'si için `libraryFilter="all"`.
 */
export function MediaLibraryPickerDialog({
  open,
  onClose,
  onSelect,
  libraryFilter = 'images',
}: MediaLibraryPickerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setPage(1);
      setSearch('');
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const params =
    libraryFilter === 'images'
      ? ({ page, pageSize: PAGE_SIZE, mimeType: 'image/', ...(search ? { search } : {}) } as const)
      : ({ page, pageSize: PAGE_SIZE, ...(search ? { search } : {}) } as const);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'media', 'picker', params],
    queryFn: () => listMedia(params),
    enabled: open,
    staleTime: 15_000,
  });

  const items = data?.items ?? [];

  const handlePick = (url: string) => {
    onSelect(url);
    onClose();
  };

  const filterHint =
    libraryFilter === 'images'
      ? 'Yalnızca görseller listeleniyor.'
      : 'Tüm yüklü dosyalar listeleniyor (PDF dahil).';

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(100vw-2rem,56rem)] max-h-[85vh] overflow-hidden rounded-2xl border border-kron-light bg-white p-0 shadow-hero backdrop:bg-kron-navy/60"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex flex-shrink-0 flex-wrap items-start justify-between gap-3 border-b border-kron-light px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-kron-navy">Medya kitaplığından seç</h2>
            <p className="mt-1 text-xs text-kron-gray">{filterHint}</p>
          </div>
          <button type="button" onClick={() => onClose()} className="btn-ghost text-xs">
            Kapat
          </button>
        </div>

        <div className="flex-shrink-0 border-b border-kron-light px-5 py-3">
          <input
            type="search"
            placeholder="Dosya adı veya MIME ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full max-w-md rounded-md border border-kron-light bg-white px-3 py-1.5 text-sm outline-none focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {getApiErrorMessage(error, 'Liste yüklenemedi.')}
            </div>
          )}

          <div
            className={cn(
              'grid gap-3',
              'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
            )}
          >
            {isLoading && !items.length
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-pulse rounded-xl bg-kron-light/80"
                  />
                ))
              : items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handlePick(m.url)}
                    title={m.originalName}
                    className={cn(
                      'group flex flex-col overflow-hidden rounded-xl border border-kron-light bg-white text-left shadow-sm outline-none transition',
                      'focus-visible:ring-2 focus-visible:ring-kron-blue focus-visible:ring-offset-2',
                      'hover:border-kron-accent hover:shadow-md',
                    )}
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
                        <div className="grid h-full place-items-center text-xs font-semibold uppercase text-kron-gray">
                          PDF
                        </div>
                      )}
                    </div>
                    <p className="line-clamp-2 p-2 text-[10px] font-medium leading-tight text-kron-navy">
                      {m.originalName}
                      <span className="mt-0.5 block font-normal text-kron-gray">
                        {formatDate(m.createdAt, 'en')}
                      </span>
                    </p>
                  </button>
                ))}
          </div>

          {!isLoading && !items.length && !isError ? (
            <p className="py-12 text-center text-sm text-kron-gray">
              Henüz eşleşen dosya yok. Önce{' '}
              <span className="font-medium text-kron-dark">Media Library</span> üzerinden yükleyin.
            </p>
          ) : null}
        </div>

        {data ? (
          <div className="flex-shrink-0 border-t border-kron-light px-5 py-3">
            <AdminPagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
