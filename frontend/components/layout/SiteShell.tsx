import type { ReactNode } from 'react';
import type { Locale } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

interface SiteShellProps {
  locale: Locale;
  children: ReactNode;
}

/**
 * Marketing/public sayfaların ortak iskeleti — navbar + main
 * + footer. Admin paneli (ADIM 19) bunu kullanmaz, kendi shell'ini yapar.
 *
 * Navbar `fixed` konumlu olduğu için `<main>` üstüne ekstra padding
 * eklemiyoruz: hero bölümleri header'ın altına doğrudan akıyor. Normal
 * sayfaların (blog, contact) içeriği ise kendi bölümüne `pt-24` benzeri
 * offset koyar — ADIM 13+ sayfalarında ele alınır.
 */
export async function SiteShell({ locale, children }: SiteShellProps) {
  const dictionary = getDictionary(locale);

  return (
    <>
      <Navbar locale={locale} dictionary={dictionary} announcementOffsetPx={0} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer locale={locale} />
    </>
  );
}
