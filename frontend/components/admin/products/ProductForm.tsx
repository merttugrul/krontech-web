'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Locale } from '@/lib/types';
import {
  createProduct,
  listProductCategories,
  updateProduct,
  type CreateProductPayload,
} from '@/lib/admin/api-products';
import type {
  AdminProduct,
  AdminProductTranslation,
  ContentStatus,
} from '@/lib/admin/types';
import { FormCard, FormGrid } from '@/components/admin/FormCard';
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/FormField';
import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { JsonBlockEditor } from '@/components/admin/JsonBlockEditor';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface ProductFormProps {
  mode: 'create' | 'edit';
  initial?: AdminProduct;
}

const EMPTY_TRANSLATION = (locale: Locale): AdminProductTranslation => ({
  locale,
  title: '',
  shortDescription: '',
  solution: null,
  howItWorks: null,
  keyBenefits: null,
  productFamily: null,
  videos: null,
  metaTitle: null,
  metaDescription: null,
  canonicalUrl: null,
  ogImage: null,
  noIndex: false,
});

interface FormState {
  slug: string;
  kind: 'product' | 'solution';
  categoryId: string;
  status: ContentStatus;
  scheduledAt: string;
  order: number;
  translations: Record<Locale, AdminProductTranslation>;
}

function initialState(initial: AdminProduct | undefined): FormState {
  const byLocale: Record<Locale, AdminProductTranslation> = {
    en: EMPTY_TRANSLATION('en'),
    tr: EMPTY_TRANSLATION('tr'),
  };
  initial?.translations.forEach((t) => {
    byLocale[t.locale] = { ...EMPTY_TRANSLATION(t.locale), ...t };
  });
  return {
    slug: initial?.slug ?? '',
    kind: initial?.kind ?? 'product',
    categoryId: initial?.categoryId ?? '',
    status: initial?.status ?? 'draft',
    scheduledAt: initial?.scheduledAt ? toDateTimeLocal(initial.scheduledAt) : '',
    order: initial?.order ?? 0,
    translations: byLocale,
  };
}

export function ProductForm({ mode, initial }: ProductFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [activeLocale, setActiveLocale] = useState<Locale>('en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['admin', 'product-categories'],
    queryFn: listProductCategories,
    staleTime: 60_000,
  });

  const trErrors = useMemo(() => buildLocaleErrors(errors), [errors]);

  const save = useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      return mode === 'create' || !initial
        ? createProduct(payload)
        : updateProduct(initial.id, payload);
    },
    onSuccess: () => {
      console.log('SUCCESS - yönlendiriliyor');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      router.push('/admin/products' as never);
    },
    onError: (err) => {
      console.log('ERROR:', err);
    },
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const setTr = (locale: Locale, patch: Partial<AdminProductTranslation>) => {
    setState((s) => ({
      ...s,
      translations: {
        ...s.translations,
        [locale]: { ...s.translations[locale], ...patch },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit çağrıldı');
    setSubmitError(null);

    const errs = validate(state);
    console.log('Validasyon hataları:', errs);
    console.log('State:', JSON.stringify(state, null, 2));
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      console.log('Validasyon geçemedi, hatalar:', errs);
      // Hatalı dil varsa oraya atla
      if (errs['en.title'] || errs['en.shortDescription']) setActiveLocale('en');
      else if (errs['tr.title'] || errs['tr.shortDescription']) setActiveLocale('tr');
      return;
    }

    console.log('Validasyon geçti, mutate çağrılıyor');
    save.mutate(buildPayload(state));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">
            {mode === 'create'
              ? state.kind === 'solution'
                ? 'Yeni Çözüm'
                : 'Yeni Ürün'
              : state.kind === 'solution'
                ? 'Çözüm Düzenle'
                : 'Ürün Düzenle'}
          </h1>
          {initial && (
            <p className="mt-1 flex items-center gap-2 text-sm text-kron-gray">
              <StatusBadge status={initial.status} />
              <span>/{initial.slug}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost text-sm"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="btn-primary text-sm"
          >
            {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </header>

      {submitError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormCard
            title="Çeviriler"
            description="EN zorunlu, TR opsiyonel (eksikse Türk ziyaretçiye EN gösterilir)."
            actions={
              <LocaleTabs
                value={activeLocale}
                onChange={setActiveLocale}
                hasError={{
                  en: !!(trErrors.en && Object.keys(trErrors.en).length),
                  tr: !!(trErrors.tr && Object.keys(trErrors.tr).length),
                }}
              />
            }
          >
            <TranslationFields
              locale={activeLocale}
              value={state.translations[activeLocale]}
              onChange={(patch) => setTr(activeLocale, patch)}
              errors={trErrors[activeLocale] ?? {}}
            />
          </FormCard>
        </div>

        <aside className="space-y-6">
          <FormCard title="Yayın">
            <AdminSelect
              label="Durum"
              value={state.status}
              onChange={(e) => setField('status', e.target.value as ContentStatus)}
            >
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="scheduled">Planlı</option>
            </AdminSelect>
            {state.status === 'scheduled' && (
              <AdminInput
                label="Yayın tarihi"
                type="datetime-local"
                value={state.scheduledAt}
                onChange={(e) => setField('scheduledAt', e.target.value)}
                error={errors.scheduledAt}
              />
            )}
          </FormCard>

          <FormCard title="Ayarlar">
            <AdminSelect
              label="Tür"
              value={state.kind}
              onChange={(e) =>
                setField(
                  'kind',
                  e.target.value === 'solution' ? 'solution' : 'product',
                )
              }
            >
              <option value="product">Ürün</option>
              <option value="solution">Çözüm</option>
            </AdminSelect>
            <AdminInput
              label="Slug"
              value={state.slug}
              onChange={(e) => setField('slug', e.target.value)}
              hint="Boş bırakılırsa EN başlıktan otomatik üretilir."
              placeholder="kron-pam"
            />
            <AdminSelect
              label="Kategori"
              value={state.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
            >
              <option value="">— Yok —</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.translations.find((t) => t.locale === 'en')?.name ?? c.slug}
                </option>
              ))}
            </AdminSelect>
            <AdminInput
              label="Sıralama"
              type="number"
              min={0}
              value={state.order}
              onChange={(e) => setField('order', Number(e.target.value) || 0)}
              hint="Düşük değer önce gösterilir."
            />
          </FormCard>
        </aside>
      </div>
    </form>
  );
}

interface TranslationFieldsProps {
  locale: Locale;
  value: AdminProductTranslation;
  onChange: (patch: Partial<AdminProductTranslation>) => void;
  errors: Record<string, string>;
}

function TranslationFields({ locale, value, onChange, errors }: TranslationFieldsProps) {
  const required = locale === 'en';
  return (
    <div className="space-y-4">
      <FormGrid columns={1}>
        <AdminInput
          label="Başlık"
          required={required}
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          error={errors.title}
          placeholder="Kron Telemetry Pipeline"
        />
        <AdminTextarea
          label="Kısa açıklama"
          required={required}
          rows={3}
          value={value.shortDescription}
          onChange={(e) => onChange({ shortDescription: e.target.value })}
          error={errors.shortDescription}
          hint="Listelerde ve hero altında gösterilir (minimum 10 karakter)."
        />
      </FormGrid>

      <JsonBlockEditor
        label="Solution bloğu"
        value={value.solution}
        onChange={(v) => onChange({ solution: v as unknown })}
        hint={'Şema: { heading?, description, bullets? }'}
      />
      <JsonBlockEditor
        label="How it works"
        value={value.howItWorks}
        onChange={(v) => onChange({ howItWorks: v as unknown })}
        hint={'Şema: { heading?, steps: [{ title, description }] }'}
      />
      <JsonBlockEditor
        label="Key benefits"
        value={value.keyBenefits}
        onChange={(v) => onChange({ keyBenefits: v as unknown })}
        hint={
          'Şema: { heading?, items: [{ title, description, icon: shield|bolt|graph|globe|check }] }'
        }
      />
      <JsonBlockEditor
        label="Product family"
        value={value.productFamily}
        onChange={(v) => onChange({ productFamily: v as unknown })}
        hint={'Şema: { heading?, slugs: ["slug-1", "slug-2"] }'}
      />
      <JsonBlockEditor
        label="Videos"
        value={value.videos}
        onChange={(v) => onChange({ videos: v as unknown })}
        hint={'Şema: { heading?, items: [{ title, youtubeUrl }] }'}
      />

      <FormCard title="SEO" className="border-0 bg-kron-light/40 shadow-none">
        <FormGrid>
          <AdminInput
            label="Meta title"
            value={value.metaTitle ?? ''}
            onChange={(e) => onChange({ metaTitle: e.target.value || null })}
            hint="Boşsa otomatik: `{Başlık} · Krontech`"
          />
          <AdminInput
            label="Canonical URL"
            value={value.canonicalUrl ?? ''}
            onChange={(e) => onChange({ canonicalUrl: e.target.value || null })}
          />
        </FormGrid>
        <AdminTextarea
          label="Meta description"
          rows={2}
          value={value.metaDescription ?? ''}
          onChange={(e) => onChange({ metaDescription: e.target.value || null })}
        />
        <MediaPicker
          label="OG Image"
          value={value.ogImage}
          onChange={(url) => onChange({ ogImage: url })}
          hint="Social share kartı için kapak görseli (1200×630 önerilir)."
        />
        <AdminCheckbox
          label="noindex"
          hint="İşaretlerseniz bu dildeki sayfa arama motorlarından gizlenir."
          checked={!!value.noIndex}
          onChange={(e) => onChange({ noIndex: e.target.checked })}
        />
      </FormCard>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function validate(state: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  const en = state.translations.en;
  const tr = state.translations.tr;

  if (!en.title || en.title.trim().length < 2) {
    errs['en.title'] = 'EN başlık en az 2 karakter olmalı.';
  }
  if (!en.shortDescription || en.shortDescription.trim().length < 10) {
    errs['en.shortDescription'] = 'EN kısa açıklama en az 10 karakter olmalı.';
  }

  // TR opsiyonel ama dolduruluyorsa minimum kısıtlar geçerli
  if (tr.title && tr.title.trim().length > 0 && tr.title.trim().length < 2) {
    errs['tr.title'] = 'TR başlık en az 2 karakter olmalı.';
  }
  if (
    tr.shortDescription &&
    tr.shortDescription.trim().length > 0 &&
    tr.shortDescription.trim().length < 10
  ) {
    errs['tr.shortDescription'] = 'TR açıklama en az 10 karakter olmalı.';
  }

  if (state.status === 'scheduled') {
    if (!state.scheduledAt) {
      errs.scheduledAt = 'Planlı yayın için tarih seçin.';
    } else if (new Date(state.scheduledAt).getTime() < Date.now()) {
      errs.scheduledAt = 'Tarih gelecekte olmalı.';
    }
  }

  return errs;
}

function buildLocaleErrors(errors: Record<string, string>): Partial<
  Record<Locale, Record<string, string>>
> {
  const out: Partial<Record<Locale, Record<string, string>>> = {};
  for (const [key, msg] of Object.entries(errors)) {
    if (key.startsWith('en.')) {
      out.en = { ...(out.en ?? {}), [key.slice(3)]: msg };
    } else if (key.startsWith('tr.')) {
      out.tr = { ...(out.tr ?? {}), [key.slice(3)]: msg };
    }
  }
  return out;
}

function buildPayload(state: FormState): CreateProductPayload {
  const translations = (['en', 'tr'] as Locale[])
    .map((locale) => state.translations[locale])
    .filter((t) => t.title.trim() && t.shortDescription.trim())
    .map((t) => ({
      locale: t.locale,
      title: t.title.trim(),
      shortDescription: t.shortDescription.trim(),
      solution: t.solution ?? undefined,
      howItWorks: t.howItWorks ?? undefined,
      keyBenefits: t.keyBenefits ?? undefined,
      productFamily: t.productFamily ?? undefined,
      videos: t.videos ?? undefined,
      metaTitle: t.metaTitle ?? undefined,
      metaDescription: t.metaDescription ?? undefined,
      canonicalUrl: t.canonicalUrl ?? undefined,
      ogImage: t.ogImage ?? undefined,
      noIndex: t.noIndex ?? undefined,
      structuredData: t.structuredData ?? undefined,
    }));

  return {
    ...(state.slug.trim() ? { slug: state.slug.trim() } : {}),
    kind: state.kind,
    ...(state.categoryId ? { categoryId: state.categoryId } : {}),
    status: state.status,
    ...(state.status === 'scheduled' && state.scheduledAt
      ? { scheduledAt: new Date(state.scheduledAt).toISOString() }
      : {}),
    order: state.order,
    translations,
  };
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
