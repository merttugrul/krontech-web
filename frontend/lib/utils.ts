import type { Locale } from './types';

/**
 * Locale'i URL prefix'inden çıkarır. `/tr/blog/x` → 'tr', diğer her şey 'en'.
 * Layout/component'lar `usePathname()` veya `params.locale` ile çağırır.
 */
export function getLocaleFromPath(pathname: string): Locale {
  return pathname.startsWith('/tr') ? 'tr' : 'en';
}

/**
 * Locale'e göre path prefix. 'en' için '' (kök), 'tr' için '/tr'.
 * URL inşasında default locale (en) için prefix eklememek SEO/redirect/UX için
 * önemli — aksi halde `/en/products` ve `/products` iki ayrı sayfa olur.
 */
export function localePrefix(locale: Locale): string {
  return locale === 'tr' ? '/tr' : '';
}

/**
 * Two locale-aware formatter'lar: tarih + sayı. i18n kütüphanesi kurmadan
 * Intl API kullanarak kontrol elimizde.
 */
export function formatDate(
  date: string | Date,
  locale: Locale = 'en',
  opts?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opts,
  }).format(d);
}

/**
 * className birleştirici — clsx/tailwind-merge paket eklemekten kaçınıyoruz.
 * Basit filter(Boolean) + join yeterli.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Plain-text için kaba truncate. Blog excerpt / meta description
 * sınırlamalarında kullanırız.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * HTML içerikten kaba okuma süresi (dakika) hesaplar. 225 wpm ortalama.
 * Resim/heavy media için overestimate değil underestimate daha dürüst —
 * ekstra padding eklemiyoruz.
 */
export function readingTimeMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 1;
  const words = text.split(' ').length;
  return Math.max(1, Math.round(words / 225));
}
