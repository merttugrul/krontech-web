'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAnnouncement,
  updateAnnouncement,
  type CreateAnnouncementPayload,
} from '@/lib/admin/api-announcement';
import type { AdminAnnouncementBar } from '@/lib/admin/types';
import { getApiErrorMessage } from '@/lib/api';
import { FormCard, FormGrid } from '@/components/admin/FormCard';
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/FormField';

function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(local: string): string | undefined {
  if (!local.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

interface AnnouncementFormProps {
  mode: 'create' | 'edit';
  initial?: AdminAnnouncementBar;
}

export function AnnouncementForm({ mode, initial }: AnnouncementFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [locale, setLocale] = useState<'en' | 'tr'>(
    initial?.locale === 'tr' ? 'tr' : 'en',
  );
  const [text, setText] = useState(initial?.text ?? '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? '');
  const [linkLabel, setLinkLabel] = useState(initial?.linkLabel ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [startDate, setStartDate] = useState(toDateTimeLocal(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateTimeLocal(initial?.endDate));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (payload: CreateAnnouncementPayload) =>
      mode === 'create' || !initial
        ? createAnnouncement(payload)
        : updateAnnouncement(initial.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcement-bar'] });
      router.push('/admin/announcement' as never);
    },
    onError: (err) => {
      setSubmitError(getApiErrorMessage(err, 'Kaydetme başarısız.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const next: Record<string, string> = {};
    if (text.trim().length < 3) next.text = 'En az 3 karakter';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: CreateAnnouncementPayload = {
      locale,
      text: text.trim(),
      isActive,
      startDate: fromDateTimeLocal(startDate),
      endDate: fromDateTimeLocal(endDate),
      ...(linkUrl.trim() ? { linkUrl: linkUrl.trim() } : {}),
      ...(linkLabel.trim() ? { linkLabel: linkLabel.trim() } : {}),
    };
    save.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">
            {mode === 'create' ? 'Yeni duyuru' : 'Duyuru düzenle'}
          </h1>
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

      <FormCard title="İçerik">
        <FormGrid>
          <AdminSelect
            label="Dil"
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'en' | 'tr')}
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </AdminSelect>
          <div className="sm:col-span-2">
            <AdminCheckbox
              label="Aktif"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>
        </FormGrid>
        <div className="mt-4">
          <AdminTextarea
            label="Metin"
            required
            rows={3}
            maxLength={300}
            value={text}
            onChange={(e) => setText(e.target.value)}
            error={errors.text}
          />
        </div>
        <div className="mt-4">
          <FormGrid>
            <AdminInput
              label="Link URL"
              optional
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
            />
            <AdminInput
              label="Link etiketi"
              optional
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
            />
          </FormGrid>
        </div>
      </FormCard>

      <FormCard
        title="Yayın penceresi"
        description="Boş bırakılırsa süresiz / hemen geçerli."
      >
        <FormGrid>
          <AdminInput
            label="Başlangıç"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <AdminInput
            label="Bitiş"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </FormGrid>
      </FormCard>
    </form>
  );
}
