'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';
import type { Locale } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import {
  buildContactSchema,
  type ContactFormValues,
} from '@/lib/schemas/contact';
import { FormField, FormTextarea } from './FormField';

interface ContactFormProps {
  locale: Locale;
  dict: Dictionary;
  source?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Contact form. RHF + zod ile validate edilir, reCAPTCHA v3 token'ı
 * `useGoogleReCaptcha` hook'u ile submit anında alınır. Başarı durumunda
 * form resetlenir ve success mesajı gösterilir.
 *
 * UX notları:
 * - Honeypot (`website`) görünmez ama DOM'da mevcut — basit botları yakalar.
 * - Submit butonu loading state'de disable + metin değişir.
 * - Rate limit (429) ayrı mesaj üretir — kullanıcıya "try later" bildirir.
 */
export function ContactForm({ locale, dict, source = 'contact_page' }: ContactFormProps) {
  const schema = buildContactSchema(dict);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const { executeRecaptcha } = useGoogleReCaptcha();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = dict.contact;

  async function onSubmit(values: ContactFormValues) {
    setStatus('submitting');
    setErrorMessage(null);

    // Honeypot tetiklenirse sessizce "başarılı" göster — botlara hint verme.
    if (values.website && values.website.length > 0) {
      setStatus('success');
      reset();
      return;
    }

    try {
      let recaptchaToken: string | undefined;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('contact_submit');
        } catch {
          recaptchaToken = undefined;
        }
      }

      await api.post('/forms/contact', {
        name: values.name,
        email: values.email,
        company: values.company,
        phone: values.phone,
        message: values.message,
        source,
        locale,
        recaptchaToken,
      });

      setStatus('success');
      reset();
    } catch (err) {
      setStatus('error');
      if (err instanceof AxiosError) {
        if (err.response?.status === 429) {
          setErrorMessage(t.errorRateLimited);
        } else if (err.response?.status === 401) {
          setErrorMessage(t.errorRecaptcha);
        } else {
          setErrorMessage(t.errorGeneric);
        }
      } else {
        setErrorMessage(t.errorGeneric);
      }
    }
  }

  if (status === 'success') {
    return (
      <SuccessCard
        title={t.successTitle}
        description={t.successContactDescription}
        ctaLabel={t.successNewSubmission}
        onReset={() => setStatus('idle')}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      aria-busy={isSubmitting || status === 'submitting'}
    >
      <HoneypotField register={register} />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t.fieldName}
          placeholder={t.placeholderName}
          autoComplete="name"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <FormField
          label={t.fieldEmail}
          type="email"
          placeholder={t.placeholderEmail}
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t.fieldCompany}
          placeholder={t.placeholderCompany}
          autoComplete="organization"
          optionalLabel={t.optionalLabel}
          error={errors.company?.message}
          {...register('company')}
        />
        <FormField
          label={t.fieldPhone}
          placeholder={t.placeholderPhone}
          autoComplete="tel"
          optionalLabel={t.optionalLabel}
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <FormTextarea
        label={t.fieldMessage}
        placeholder={t.placeholderMessage}
        rows={6}
        required
        error={errors.message?.message}
        {...register('message')}
      />

      {status === 'error' && errorMessage ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <strong className="mr-1 font-semibold">{t.errorTitle}:</strong>
          {errorMessage}
        </div>
      ) : null}

      <p className="text-xs text-slate-500">{t.privacyNotice}</p>

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto"
        disabled={isSubmitting || status === 'submitting'}
      >
        {isSubmitting || status === 'submitting' ? t.submitLoading : t.submitContact}
      </button>
    </form>
  );
}

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function HoneypotField({
  register,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
    >
      <label htmlFor="website">Website</label>
      <input
        id="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...register('website')}
      />
    </div>
  );
}

export function SuccessCard({
  title,
  description,
  ctaLabel,
  onReset,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  onReset: () => void;
}) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"
    >
      <svg
        viewBox="0 0 24 24"
        width={44}
        height={44}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mx-auto mb-4 text-emerald-500"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m8 12 3 3 5-6" />
      </svg>
      <h3 className="mb-2 text-xl font-semibold text-emerald-900">{title}</h3>
      <p className="mb-6 text-emerald-800">{description}</p>
      <button type="button" onClick={onReset} className="btn-secondary">
        {ctaLabel}
      </button>
    </div>
  );
}
