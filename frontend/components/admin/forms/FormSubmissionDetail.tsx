'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteFormSubmission, getFormSubmission } from '@/lib/admin/api-forms';
import { getCachedUser } from '@/lib/admin/session';
import { getApiErrorMessage } from '@/lib/api';
import { FormCard } from '@/components/admin/FormCard';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import {
  fieldLabelTr,
  getDataDisplayString,
  getFormDataKeysInOrder,
} from '@/lib/admin/form-submission-utils';

export function FormSubmissionDetail({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const me = getCachedUser();
  const canDelete = me?.role === 'admin';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'forms', id],
    queryFn: () => getFormSubmission(id),
  });

  const del = useMutation({
    mutationFn: () => deleteFormSubmission(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'forms'] });
      router.push('/admin/forms' as never);
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-kron-gray">Yükleniyor…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Gönderi bulunamadı.')}
      </div>
    );
  }

  const dataObj = (data.data ?? {}) as Record<string, unknown>;
  const keys = getFormDataKeysInOrder(data.formType, dataObj);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/forms" className="text-sm text-kron-blue hover:underline">
            ← Form listesi
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-kron-navy">Gönderi detayı</h1>
          <p className="mt-1 text-sm text-kron-gray">
            <span className="font-medium capitalize">{data.formType}</span>
          </p>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="btn-ghost text-sm text-red-600 hover:bg-red-50"
          >
            Sil (GDPR)
          </button>
        )}
      </div>

      <FormCard title="Bilgiler">
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-kron-gray">Tarih: </span>
            <span className="text-kron-navy">
              {formatDate(data.createdAt, 'tr', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
          <p>
            <span className="text-kron-gray">IP adresi: </span>
            <span className="text-kron-navy">{data.ipAddress ?? '—'}</span>
          </p>
          <p>
            <span className="text-kron-gray">Kaynak: </span>
            <span className="text-kron-navy break-all">{data.source ?? '—'}</span>
          </p>
        </div>
      </FormCard>

      <FormCard title="Form verisi">
        <div className="space-y-3 text-sm">
          {keys.map((key) => {
            const raw = getDataDisplayString(dataObj, key);
            const display = raw.trim() ? raw : '—';
            return (
              <p key={key} className="leading-relaxed">
                <span className="text-kron-gray">{fieldLabelTr(key)}: </span>
                <span className="whitespace-pre-wrap break-words text-kron-navy">{display}</span>
              </p>
            );
          })}
        </div>
      </FormCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Gönderiyi sil"
        description="Bu kayıt kalıcı olarak silinir (GDPR talepleri için)."
        confirmLabel="Sil"
        danger
        loading={del.isPending}
        onConfirm={() => del.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
