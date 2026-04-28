'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Native `<dialog>` kullanan confirm modal. Portal gerekmiyor, focus trap
 * browser tarafından yönetiliyor. Escape = cancel.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'İptal',
  danger,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="max-w-md rounded-2xl border border-kron-light p-0 shadow-hero backdrop:bg-kron-navy/60"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="space-y-3 px-6 pt-6">
        <h2 className="text-lg font-semibold text-kron-navy">{title}</h2>
        {description && <div className="text-sm text-kron-gray">{description}</div>}
      </div>
      <div className="flex justify-end gap-2 bg-kron-light/40 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-ghost text-xs"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={
            danger
              ? 'btn inline-flex items-center justify-center bg-red-600 text-white hover:bg-red-700 disabled:opacity-60'
              : 'btn-primary text-xs'
          }
        >
          {loading ? 'İşleniyor…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
