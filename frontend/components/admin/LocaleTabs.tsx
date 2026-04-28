'use client';

import type { Locale } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LocaleTabsProps {
  value: Locale;
  onChange: (locale: Locale) => void;
  hasError?: Partial<Record<Locale, boolean>>;
}

const LABELS: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
  tr: { flag: '🇹🇷', label: 'Türkçe' },
};

/**
 * EN/TR translation tab switcher — product ve blog form'larında kullanılır.
 * Backend EN'i zorunlu tutuyor, TR opsiyonel. Kullanıcıya hangi dilde hata
 * olduğunu `hasError` prop'u ile gösteriyoruz.
 */
export function LocaleTabs({ value, onChange, hasError }: LocaleTabsProps) {
  return (
    <div
      role="tablist"
      className="inline-flex gap-1 rounded-lg border border-kron-light bg-kron-light/40 p-1"
    >
      {(['en', 'tr'] as Locale[]).map((locale) => {
        const active = value === locale;
        const error = hasError?.[locale];
        return (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(locale)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white text-kron-navy shadow-sm'
                : 'text-kron-gray hover:bg-white/50',
              error && 'text-red-600',
            )}
          >
            <span aria-hidden className="text-base leading-none">
              {LABELS[locale].flag}
            </span>
            <span>{LABELS[locale].label}</span>
            {locale === 'en' && (
              <span className="rounded bg-kron-blue/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-kron-blue">
                Zorunlu
              </span>
            )}
            {error && (
              <span aria-label="Bu dilde hata var" className="h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
