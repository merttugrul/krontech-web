'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createResource,
  updateResource,
  type CreateResourcePayload,
  type UpdateResourcePayload,
} from '@/lib/admin/api-resources';
import { listProducts } from '@/lib/admin/api-products';
import type { AdminResource, ResourceType } from '@/lib/admin/types';
import { getApiErrorMessage } from '@/lib/api';
import { FormCard, FormGrid } from '@/components/admin/FormCard';
import { AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/FormField';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface ResourceFormProps {
  mode: 'create' | 'edit';
  initial?: AdminResource;
}

type ResourceStatus = 'draft' | 'published';

export function ResourceForm({ mode, initial }: ResourceFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [type, setType] = useState<ResourceType>(initial?.type ?? 'datasheet');
  const [locale, setLocale] = useState<'en' | 'tr'>(
    (initial?.locale === 'tr' ? 'tr' : 'en') as 'en' | 'tr',
  );
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [productId, setProductId] = useState(initial?.productId ?? '');
  const [status, setStatus] = useState<ResourceStatus>(
    initial?.status === 'draft' ? 'draft' : 'published',
  );
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: productsPage } = useQuery({
    queryKey: ['admin', 'products', 'picker'],
    queryFn: () => listProducts({ page: 1, pageSize: 200, status: 'all' }),
    staleTime: 60_000,
  });

  const productOptions = useMemo(() => {
    const items = productsPage?.items ?? [];
    return items.map((p) => ({ value: p.id, label: `${p.title} (/${p.slug})` }));
  }, [productsPage]);

  const save = useMutation({
    mutationFn: async (payload: CreateResourcePayload | UpdateResourcePayload) =>
      mode === 'create' || !initial
        ? createResource(payload as CreateResourcePayload)
        : updateResource(initial.id, payload as UpdateResourcePayload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'resources'] });
      router.push('/admin/resources' as never);
    },
    onError: (err) => {
      setSubmitError(getApiErrorMessage(err, 'Kaydetme başarısız.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = 'En az 3 karakter';
    if (!fileUrl.trim()) next.fileUrl = 'Dosya URL gerekli';
    setErrors(next);
    if (Object.keys(next).length) return;

    const base = {
      type,
      fileUrl: fileUrl.trim(),
      locale,
      title: title.trim(),
      status,
      order: Number(order) || 0,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(coverImage.trim() ? { coverImage: coverImage.trim() } : {}),
    };

    if (mode === 'create' || !initial) {
      save.mutate({
        ...base,
        ...(productId ? { productId } : {}),
      });
    } else {
      const patch: UpdateResourcePayload = {
        ...base,
        productId: productId || null,
      };
      save.mutate(patch);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">
            {mode === 'create' ? 'Yeni kaynak' : 'Kaynak düzenle'}
          </h1>
          {initial && (
            <p className="mt-1 flex items-center gap-2 text-sm text-kron-gray">
              <StatusBadge status={initial.status} />
              <span>{initial.type}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
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

      <FormCard title="Temel bilgiler">
        <FormGrid>
          <AdminSelect
            label="Tip"
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType)}
          >
            <option value="datasheet">Datasheet</option>
            <option value="casestudy">Case study</option>
            <option value="whitepaper">Whitepaper</option>
          </AdminSelect>
          <AdminSelect
            label="Dil"
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'en' | 'tr')}
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </AdminSelect>
          <AdminSelect
            label="Durum"
            hint="Kaynaklar için yalnızca taslak veya yayında."
            value={status}
            onChange={(e) => setStatus(e.target.value as ResourceStatus)}
          >
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
          </AdminSelect>
          <AdminInput
            label="Sıra"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </FormGrid>
        <div className="mt-4">
          <AdminInput
            label="Başlık"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />
        </div>
        <div className="mt-4">
          <AdminTextarea
            label="Açıklama"
            optional
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </FormCard>

      <FormCard title="Dosyalar">
        <MediaPicker
          label="İndirilebilir dosya (fileUrl)"
          value={fileUrl}
          onChange={(v) => setFileUrl(v ?? '')}
          hint="PDF veya medya — yükle veya URL yapıştır."
          libraryFilter="all"
        />
        {errors.fileUrl && (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.fileUrl}</p>
        )}
        <div className="mt-4">
          <MediaPicker
            label="Kapak görseli"
            value={coverImage || null}
            onChange={(v) => setCoverImage(v ?? '')}
            hint="Liste ve detay sayfalarında kullanılabilir (isteğe bağlı)."
          />
        </div>
      </FormCard>

      <FormCard
        title="İlişkiler"
        description="İsteğe bağlı ürün bağlantısı. Düzenlemede Yok seçerek bağlantıyı kaldırın."
      >
        <AdminSelect
          label="Ürün"
          optional
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">— Yok —</option>
          {productOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </AdminSelect>
      </FormCard>
    </form>
  );
}
