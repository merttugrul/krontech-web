'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadMediaFile } from '@/lib/admin/api-media';
import { getApiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MediaPickerProps {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  hint?: string;
  accept?: string;
  /** Upload edilen dosyadan önce ek metadata kaydetmek istersen. */
  onUploaded?: (url: string) => void;
}

/**
 * Medya seçici — iki mod:
 *  1. URL yapıştır (hızlı — mevcut bir S3 URL'sini paste et)
 *  2. Dosya yükle (presign → PUT → commit)
 *
 * Backend whitelist'i (PresignMediaDto): jpeg, png, webp, svg+xml, gif, pdf.
 * Max size: 50MB.
 */
export function MediaPicker({
  label,
  value,
  onChange,
  hint,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf',
  onUploaded,
}: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: uploadMediaFile,
    onSuccess: (media) => {
      setError(null);
      onChange(media.url);
      onUploaded?.(media.url);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, 'Yükleme başarısız.'));
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    upload.mutate(file);
    event.target.value = '';
  };

  const isImage = value && /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-kron-dark">{label}</label>

      <div className="flex flex-wrap items-start gap-3">
        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-20 w-20 flex-shrink-0 rounded-lg border border-kron-light object-cover"
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="url"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="https://cdn.krontech.com/..."
            className="w-full rounded-lg border border-kron-light bg-white px-3 py-2 text-sm outline-none transition focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="btn-secondary text-xs"
            >
              {upload.isPending ? 'Yükleniyor…' : '↑ Dosya yükle'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="btn-ghost text-xs text-red-600 hover:bg-red-50"
              >
                Temizle
              </button>
            )}
            <span className="text-[11px] text-kron-gray">
              JPG · PNG · WebP · SVG · GIF · PDF · max 50MB
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className={cn('text-xs font-medium text-red-600')}>
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-kron-gray">{hint}</p>}
    </div>
  );
}
