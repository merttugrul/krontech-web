'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRedirect,
  updateRedirect,
  type CreateRedirectPayload,
} from '@/lib/admin/api-redirects';
import type { AdminRedirect } from '@/lib/admin/types';
import { getApiErrorMessage } from '@/lib/api';
import { FormCard, FormGrid } from '@/components/admin/FormCard';
import { AdminCheckbox, AdminInput, AdminSelect } from '@/components/admin/FormField';

interface RedirectFormProps {
  mode: 'create' | 'edit';
  initial?: AdminRedirect;
}

export function RedirectForm({ mode, initial }: RedirectFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [fromPath, setFromPath] = useState(initial?.fromPath ?? '');
  const [toPath, setToPath] = useState(initial?.toPath ?? '');
  const [statusCode, setStatusCode] = useState<301 | 302>(initial?.statusCode ?? 301);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (payload: CreateRedirectPayload) =>
      mode === 'create' || !initial
        ? createRedirect(payload)
        : updateRedirect(initial.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'redirects'] });
      router.push('/admin/redirects' as never);
    },
    onError: (err) => {
      setSubmitError(getApiErrorMessage(err, 'Kaydetme başarısız.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const next: Record<string, string> = {};
    if (!fromPath.trim().startsWith('/')) {
      next.fromPath = 'Kaynak path "/" ile başlamalı';
    }
    if (!toPath.trim()) next.toPath = 'Hedef path gerekli';
    setErrors(next);
    if (Object.keys(next).length) return;

    save.mutate({
      fromPath: fromPath.trim(),
      toPath: toPath.trim(),
      statusCode,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">
            {mode === 'create' ? 'Yeni redirect' : 'Redirect düzenle'}
          </h1>
          {initial && (
            <p className="mt-1 font-mono text-sm text-kron-gray">{initial.fromPath}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost text-sm">
            Geri
          </button>
          <button type="submit" disabled={save.isPending} className="btn-primary text-sm">
            {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </header>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <FormCard title="Kural">
        <FormGrid>
          <AdminInput
            label="Kaynak path (fromPath)"
            required
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
            placeholder="/eski-url"
            error={errors.fromPath}
            hint='"/" ile başlamalı; boşluk veya ?/# kullanmayın.'
          />
          <AdminInput
            label="Hedef (toPath)"
            required
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
            placeholder="/yeni-url"
            error={errors.toPath}
          />
          <AdminSelect
            label="HTTP durum kodu"
            value={String(statusCode)}
            onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 302)}
          >
            <option value="301">301 Kalıcı</option>
            <option value="302">302 Geçici</option>
          </AdminSelect>
        </FormGrid>
        <div className="mt-4">
          <AdminCheckbox
            label="Aktif"
            hint="Pasif kurallar middleware tarafından uygulanmaz."
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        </div>
      </FormCard>
    </form>
  );
}
