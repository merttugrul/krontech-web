'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOffice, updateOffice, type CreateOfficePayload } from '@/lib/admin/api-offices';
import type { AdminOffice } from '@/lib/admin/types';
import { getApiErrorMessage } from '@/lib/api';
import { FormCard, FormGrid } from '@/components/admin/FormCard';
import { AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/FormField';
import { MediaPicker } from '@/components/admin/MediaPicker';

interface OfficeFormProps {
  mode: 'create' | 'edit';
  initial?: AdminOffice;
}

export function OfficeForm({ mode, initial }: OfficeFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [city, setCity] = useState(initial?.city ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [fax, setFax] = useState(initial?.fax ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [imagePosition, setImagePosition] = useState<'left' | 'right'>(
    initial?.imagePosition === 'left' ? 'left' : 'right',
  );
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [locale, setLocale] = useState<'en' | 'tr'>(
    initial?.locale === 'tr' ? 'tr' : 'en',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (payload: CreateOfficePayload) =>
      mode === 'create' || !initial ? createOffice(payload) : updateOffice(initial.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offices'] });
      router.push('/admin/offices' as never);
    },
    onError: (err) => {
      setSubmitError(getApiErrorMessage(err, 'Kaydetme başarısız.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const next: Record<string, string> = {};
    if (!city.trim()) next.city = 'Gerekli';
    if (!email.trim()) next.email = 'Gerekli';
    if (phone.trim().length < 5) next.phone = 'En az 5 karakter';
    if (address.trim().length < 10) next.address = 'En az 10 karakter';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: CreateOfficePayload = {
      city: city.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      imagePosition,
      order: Number(order) || 0,
      locale,
      ...(fax.trim() ? { fax: fax.trim() } : {}),
      ...(image.trim() ? { image: image.trim() } : {}),
    };
    save.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">
            {mode === 'create' ? 'Yeni ofis' : 'Ofis düzenle'}
          </h1>
          {initial && <p className="mt-1 text-sm text-kron-gray">{initial.city}</p>}
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

      <FormCard title="Konum ve dil">
        <FormGrid>
          <AdminInput
            label="Şehir"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            error={errors.city}
          />
          <AdminSelect
            label="Dil"
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'en' | 'tr')}
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </AdminSelect>
          <AdminInput
            label="Sıra"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </FormGrid>
      </FormCard>

      <FormCard title="İletişim">
        <FormGrid>
          <AdminInput
            label="E-posta"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <AdminInput
            label="Telefon"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
          />
          <AdminInput
            label="Faks"
            optional
            value={fax}
            onChange={(e) => setFax(e.target.value)}
          />
        </FormGrid>
        <div className="mt-4">
          <AdminTextarea
            label="Adres"
            required
            rows={4}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors.address}
          />
        </div>
      </FormCard>

      <FormCard title="Görsel">
        <FormGrid>
          <AdminSelect
            label="Görsel konumu"
            value={imagePosition}
            onChange={(e) => setImagePosition(e.target.value as 'left' | 'right')}
          >
            <option value="right">Sağ</option>
            <option value="left">Sol</option>
          </AdminSelect>
        </FormGrid>
        <div className="mt-4">
          <MediaPicker
            label="Ofis görseli"
            value={image || null}
            onChange={(v) => setImage(v ?? '')}
            hint="İsteğe bağlı — harita veya bina fotoğrafı."
          />
        </div>
      </FormCard>
    </form>
  );
}
