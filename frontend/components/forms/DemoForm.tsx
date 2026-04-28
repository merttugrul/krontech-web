'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';
import type { Locale } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { buildDemoSchema, type DemoFormValues } from '@/lib/schemas/contact';
import { FormField, FormTextarea } from './FormField';
import { SuccessCard } from './ContactForm';

interface DemoFormProps {
  locale: Locale;
  dict: Dictionary;
  source?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Demo request formu. Contact'tan farkı:
 *  - `company` zorunlu (B2B demo akışı).
 *  - `jobTitle` ve `productInterest` ek opsiyonel alanlar.
 *  - `message` opsiyonel — kullanıcı sadece "demo istiyorum" da diyebilir.
 */
export function DemoForm({ locale, dict, source = 'demo_page' }: DemoFormProps) {
  const schema = buildDemoSchema(dict);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const { executeRecaptcha } = useGoogleReCaptcha();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = dict.contact;

  async function onSubmit(values: DemoFormValues) {
    setStatus('submitting');
    setErrorMessage(null);

    if (values.website && values.website.length > 0) {
      setStatus('success');
      reset();
      return;
    }

    try {
      let recaptchaToken: string | undefined;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('demo_submit');
        } catch {
          recaptchaToken = undefined;
        }
      }

      await api.post('/forms/demo', {
        name: values.name,
        email: values.email,
        company: values.company,
        jobTitle: values.jobTitle,
        phone: values.phone,
        productInterest: values.productInterest,
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
        description={t.successDemoDescription}
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
      {/* Honeypot */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor="demo-website">Website</label>
        <input
          id="demo-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

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
          required
          error={errors.company?.message}
          {...register('company')}
        />
        <FormField
          label={t.fieldJobTitle}
          placeholder={t.placeholderJobTitle}
          autoComplete="organization-title"
          optionalLabel={t.optionalLabel}
          error={errors.jobTitle?.message}
          {...register('jobTitle')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t.fieldPhone}
          placeholder={t.placeholderPhone}
          autoComplete="tel"
          optionalLabel={t.optionalLabel}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <FormField
          label={t.fieldProductInterest}
          placeholder={t.placeholderProductInterest}
          optionalLabel={t.optionalLabel}
          error={errors.productInterest?.message}
          {...register('productInterest')}
        />
      </div>

      <FormTextarea
        label={t.fieldMessage}
        placeholder={t.placeholderMessage}
        optionalLabel={t.optionalLabel}
        rows={5}
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
        {isSubmitting || status === 'submitting' ? t.submitLoading : t.submitDemo}
      </button>
    </form>
  );
}
