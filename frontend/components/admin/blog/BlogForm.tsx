'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Locale, PostType } from '@/lib/types';
import {
  createBlogPost,
  updateBlogPost,
  type CreateBlogPayload,
} from '@/lib/admin/api-blog';
import type { AdminBlogPost, AdminBlogTranslation, ContentStatus, FaqItem } from '@/lib/admin/types';
import { getApiErrorMessage } from '@/lib/api';
import { FormCard, FormGrid } from '@/components/admin/FormCard';
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/FormField';
import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { TipTapEditor } from '@/components/admin/TipTapEditor';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface BlogFormProps {
  mode: 'create' | 'edit';
  initial?: AdminBlogPost;
}

const emptyTranslation = (locale: Locale): AdminBlogTranslation => ({
  locale,
  title: '',
  excerpt: '',
  content: '',
  faqItems: [],
  metaTitle: null,
  metaDescription: null,
  canonicalUrl: null,
  ogImage: null,
  noIndex: false,
});

interface FormState {
  slug: string;
  type: PostType;
  coverImage: string | null;
  status: ContentStatus;
  scheduledAt: string;
  isHighlight: boolean;
  /** Create: kullanıcı seçer. Edit: DB’de hangi dil varsa (yalnız TR → tr). */
  primaryLocale: Locale;
  translations: Record<Locale, AdminBlogTranslation>;
}

function inferPrimaryLocale(initial: AdminBlogPost | undefined, mode: 'create' | 'edit'): Locale {
  if (mode === 'create' || !initial) return 'en';
  const hasEn = initial.translations.some((t) => t.locale === 'en');
  const hasTr = initial.translations.some((t) => t.locale === 'tr');
  if (hasTr && !hasEn) return 'tr';
  return 'en';
}

function initialState(initial: AdminBlogPost | undefined, mode: 'create' | 'edit'): FormState {
  const byLocale: Record<Locale, AdminBlogTranslation> = {
    en: emptyTranslation('en'),
    tr: emptyTranslation('tr'),
  };
  initial?.translations.forEach((t) => {
    byLocale[t.locale] = { ...emptyTranslation(t.locale), ...t, faqItems: t.faqItems ?? [] };
  });
  return {
    slug: initial?.slug ?? '',
    type: initial?.type ?? 'blog',
    coverImage: initial?.coverImage ?? null,
    status: initial?.status ?? 'draft',
    scheduledAt: initial?.scheduledAt ? toDateTimeLocal(initial.scheduledAt) : '',
    isHighlight: initial?.isHighlight ?? false,
    primaryLocale: inferPrimaryLocale(initial, mode),
    translations: byLocale,
  };
}

export function BlogForm({ mode, initial }: BlogFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [state, setState] = useState<FormState>(() => initialState(initial, mode));
  const [activeLocale, setActiveLocale] = useState<Locale>(() =>
    inferPrimaryLocale(initial, mode),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const localeErrors = useMemo(() => splitLocaleErrors(errors), [errors]);

  const save = useMutation({
    mutationFn: async (payload: CreateBlogPayload) =>
      mode === 'create' || !initial
        ? createBlogPost(payload)
        : updateBlogPost(initial.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog'] });
      router.push('/admin/blog' as never);
    },
    onError: (err) => setSubmitError(getApiErrorMessage(err, 'Kaydetme başarısız.')),
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const setTr = (locale: Locale, patch: Partial<AdminBlogTranslation>) =>
    setState((s) => ({
      ...s,
      translations: { ...s.translations, [locale]: { ...s.translations[locale], ...patch } },
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate(state);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const keys = Object.keys(errs);
      if (keys.some((k) => k.startsWith(`${state.primaryLocale}.`))) setActiveLocale(state.primaryLocale);
      else if (keys.some((k) => k.startsWith('en.'))) setActiveLocale('en');
      else if (keys.some((k) => k.startsWith('tr.'))) setActiveLocale('tr');
      return;
    }
    save.mutate(buildPayload(state));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">
            {mode === 'create' ? 'Yeni yazı' : 'Yazı düzenle'}
          </h1>
          {initial && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-kron-gray">
              <StatusBadge status={initial.status} />
              <span>/{initial.slug}</span>
              <span>· {initial.viewCount} görüntüleme</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost text-sm">
            İptal
          </button>
          <button type="submit" disabled={save.isPending} className="btn-primary text-sm">
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
            title="İçerik"
            description={
              state.primaryLocale === 'en'
                ? 'Zorunlu dil: EN — TR sekmesinden isteğe bağlı çeviri.'
                : 'Zorunlu dil: TR — EN sekmesinden isteğe bağlı çeviri.'
            }
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {mode === 'edit' && initial && (
                  <div className="mr-1 flex flex-wrap gap-1">
                    {!initial.translations.some((t) => t.locale === 'en') && (
                      <button
                        type="button"
                        onClick={() => setActiveLocale('en')}
                        className="rounded border border-kron-light bg-white px-2 py-1 text-[11px] font-medium text-kron-navy hover:bg-kron-light/40"
                      >
                        + EN çevirisi ekle
                      </button>
                    )}
                    {!initial.translations.some((t) => t.locale === 'tr') && (
                      <button
                        type="button"
                        onClick={() => setActiveLocale('tr')}
                        className="rounded border border-kron-light bg-white px-2 py-1 text-[11px] font-medium text-kron-navy hover:bg-kron-light/40"
                      >
                        + TR çevirisi ekle
                      </button>
                    )}
                  </div>
                )}
                <LocaleTabs
                  value={activeLocale}
                  onChange={setActiveLocale}
                  hasError={{
                    en: !!localeErrors.en,
                    tr: !!localeErrors.tr,
                  }}
                />
              </div>
            }
          >
            <TranslationFields
              locale={activeLocale}
              primaryLocale={state.primaryLocale}
              value={state.translations[activeLocale]}
              onChange={(patch) => setTr(activeLocale, patch)}
              errors={localeErrors[activeLocale] ?? {}}
            />
          </FormCard>
        </div>

        <aside className="space-y-6">
          {mode === 'create' && (
            <FormCard title="Dil" description="İlk kayıtta hangi dilin alanları zorunlu olacak.">
              <AdminSelect
                label="Zorunlu dil"
                value={state.primaryLocale}
                onChange={(e) => {
                  const pl = e.target.value as Locale;
                  setState((s) => ({
                    ...s,
                    primaryLocale: pl,
                    translations: {
                      ...s.translations,
                      [pl]: s.translations[pl],
                    },
                  }));
                  setActiveLocale(pl);
                }}
              >
                <option value="en">English (EN)</option>
                <option value="tr">Türkçe (TR)</option>
              </AdminSelect>
            </FormCard>
          )}

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
            <AdminCheckbox
              label="Öne çıkan"
              hint="Anasayfa 'son yazılar' bloğunda büyük kartta gösterilir."
              checked={state.isHighlight}
              onChange={(e) => setField('isHighlight', e.target.checked)}
            />
          </FormCard>

          <FormCard title="Ayarlar">
            <AdminSelect
              label="Tip"
              value={state.type}
              onChange={(e) => setField('type', e.target.value as PostType)}
            >
              <option value="blog">Blog</option>
              <option value="news">News</option>
            </AdminSelect>
            <AdminInput
              label="Slug"
              value={state.slug}
              onChange={(e) => setField('slug', e.target.value)}
              hint="Boş bırakılırsa zorunlu dil (Dil kartındaki seçim) başlığından üretilir."
            />
            <MediaPicker
              label="Kapak görseli"
              value={state.coverImage}
              onChange={(url) => setField('coverImage', url)}
              hint="Kart ve hero alanında kullanılır (16:9, min 1200px genişlik önerilir)."
            />
          </FormCard>
        </aside>
      </div>
    </form>
  );
}

interface TranslationFieldsProps {
  locale: Locale;
  primaryLocale: Locale;
  value: AdminBlogTranslation;
  onChange: (patch: Partial<AdminBlogTranslation>) => void;
  errors: Record<string, string>;
}

function TranslationFields({ locale, primaryLocale, value, onChange, errors }: TranslationFieldsProps) {
  const required = locale === primaryLocale;

  const updateFaq = (index: number, patch: Partial<FaqItem>) => {
    const list = [...(value.faqItems ?? [])];
    list[index] = { ...list[index], ...patch } as FaqItem;
    onChange({ faqItems: list });
  };
  const addFaq = () => {
    onChange({
      faqItems: [...(value.faqItems ?? []), { question: '', answer: '' }],
    });
  };
  const removeFaq = (index: number) => {
    const list = [...(value.faqItems ?? [])];
    list.splice(index, 1);
    onChange({ faqItems: list });
  };

  return (
    <div className="space-y-5">
      <FormGrid columns={1}>
        <AdminInput
          label="Başlık"
          required={required}
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          error={errors.title}
          placeholder="Krontech launches PAM 5.0"
        />
        <AdminTextarea
          label="Özet (excerpt)"
          required={required}
          rows={3}
          value={value.excerpt}
          onChange={(e) => onChange({ excerpt: e.target.value })}
          error={errors.excerpt}
          hint="Liste kartlarında ve Open Graph description'da görünür."
        />
      </FormGrid>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-kron-dark">
            İçerik
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          {errors.content && (
            <span className="text-xs font-medium text-red-600">{errors.content}</span>
          )}
        </div>
        <TipTapEditor
          value={value.content}
          onChange={(html) => onChange({ content: html })}
          placeholder="Yazının gövdesini buraya yazın…"
        />
      </div>

      <FormCard title="SSS / FAQ" className="border-0 bg-kron-light/40 shadow-none">
        <p className="text-xs text-kron-gray">
          Her soru-cevap çifti `FAQPage` structured data&apos;ya dönüşür (GEO/SEO için kritik).
        </p>
        <div className="space-y-3">
          {(value.faqItems ?? []).map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-kron-light bg-white p-3"
            >
              <AdminInput
                label={`Soru #${i + 1}`}
                value={f.question}
                onChange={(e) => updateFaq(i, { question: e.target.value })}
              />
              <div className="mt-2">
                <AdminTextarea
                  label="Cevap"
                  rows={2}
                  value={f.answer}
                  onChange={(e) => updateFaq(i, { answer: e.target.value })}
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeFaq(i)}
                  className="btn-ghost text-xs text-red-600 hover:bg-red-50"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addFaq} className="btn-secondary text-xs">
            + Soru ekle
          </button>
        </div>
      </FormCard>

      <FormCard title="SEO" className="border-0 bg-kron-light/40 shadow-none">
        <FormGrid>
          <AdminInput
            label="Meta title"
            value={value.metaTitle ?? ''}
            onChange={(e) => onChange({ metaTitle: e.target.value || null })}
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
        />
        <AdminCheckbox
          label="noindex"
          checked={!!value.noIndex}
          onChange={(e) => onChange({ noIndex: e.target.checked })}
        />
      </FormCard>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────

function validate(state: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  const label = (loc: Locale) => (loc === 'en' ? 'EN' : 'TR');

  const checkLocale = (loc: Locale, required: boolean) => {
    const t = state.translations[loc];
    const prefix = `${loc}.`;
    const hasAny =
      (t.title && t.title.trim().length > 0) ||
      (t.excerpt && t.excerpt.trim().length > 0) ||
      stripHtml(t.content).length > 0;

    if (!required) {
      if (!hasAny) return;
      if (!t.title || t.title.trim().length < 3) {
        errs[`${prefix}title`] = `${label(loc)} başlık en az 3 karakter olmalı.`;
      }
      if (!t.excerpt || t.excerpt.trim().length < 10) {
        errs[`${prefix}excerpt`] = `${label(loc)} özet en az 10 karakter olmalı.`;
      }
      if (!t.content || stripHtml(t.content).length < 10) {
        errs[`${prefix}content`] = `${label(loc)} içerik en az 10 karakter metin içermeli.`;
      }
      return;
    }

    if (!t.title || t.title.trim().length < 3) {
      errs[`${prefix}title`] = `${label(loc)} başlık en az 3 karakter olmalı.`;
    }
    if (!t.excerpt || t.excerpt.trim().length < 10) {
      errs[`${prefix}excerpt`] = `${label(loc)} özet en az 10 karakter olmalı.`;
    }
    if (!t.content || stripHtml(t.content).length < 10) {
      errs[`${prefix}content`] = `${label(loc)} içerik en az 10 karakter metin içermeli.`;
    }
  };

  checkLocale(state.primaryLocale, true);
  checkLocale(state.primaryLocale === 'en' ? 'tr' : 'en', false);

  if (state.status === 'scheduled') {
    if (!state.scheduledAt) errs.scheduledAt = 'Planlı yayın için tarih seçin.';
    else if (new Date(state.scheduledAt).getTime() < Date.now()) {
      errs.scheduledAt = 'Tarih gelecekte olmalı.';
    }
  }
  return errs;
}

function splitLocaleErrors(errors: Record<string, string>): Partial<
  Record<Locale, Record<string, string>>
> {
  const out: Partial<Record<Locale, Record<string, string>>> = {};
  for (const [k, v] of Object.entries(errors)) {
    if (k.startsWith('en.')) out.en = { ...(out.en ?? {}), [k.slice(3)]: v };
    else if (k.startsWith('tr.')) out.tr = { ...(out.tr ?? {}), [k.slice(3)]: v };
  }
  return out;
}

/** validate() ile aynı eşik: yalnızca tam doldurulmuş çeviriler API’ye gider (ör. sadece TR). */
function isCompleteTranslation(t: AdminBlogTranslation): boolean {
  return (
    t.title.trim().length >= 3 &&
    t.excerpt.trim().length >= 10 &&
    stripHtml(t.content).length >= 10
  );
}

function buildPayload(state: FormState): CreateBlogPayload {
  const translations = (['en', 'tr'] as Locale[])
    .map((locale) => state.translations[locale])
    .filter(isCompleteTranslation)
    .map((t) => ({
      locale: t.locale,
      title: t.title.trim(),
      excerpt: t.excerpt.trim(),
      content: t.content,
      faqItems:
        t.faqItems && t.faqItems.length > 0
          ? t.faqItems
              .filter((f) => f.question.trim().length >= 3 && f.answer.trim().length >= 3)
              .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
          : undefined,
      metaTitle: t.metaTitle ?? undefined,
      metaDescription: t.metaDescription ?? undefined,
      canonicalUrl: t.canonicalUrl ?? undefined,
      ogImage: t.ogImage ?? undefined,
      noIndex: t.noIndex ?? undefined,
    }));

  return {
    ...(state.slug.trim() ? { slug: state.slug.trim() } : {}),
    type: state.type,
    coverImage: state.coverImage ?? undefined,
    status: state.status,
    ...(state.status === 'scheduled' && state.scheduledAt
      ? { scheduledAt: new Date(state.scheduledAt).toISOString() }
      : {}),
    isHighlight: state.isHighlight,
    primaryLocale: state.primaryLocale,
    translations,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
