import Link from 'next/link';
import { sfetch } from '@/lib/api';
import type { Locale, Office } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

interface FooterProps {
  locale: Locale;
}

/**
 * Server component — ofis listesi RSC sırasında çekilir. Backend kapalıysa
 * ofis bloğu render edilmez (rest kalır).
 *
 * Yapı:
 *  [Logo + tagline]        [Company]  [Products]  [Resources]  [Legal]
 *  [Offices grid — 1-4 sütun]
 *  [Alt: copyright + social]
 */
export async function Footer({ locale }: FooterProps) {
  const dict = getDictionary(locale);
  const offices = await fetchOffices(locale);
  const prefix = localePrefix(locale);
  const year = new Date().getFullYear();

  const columns: Array<{
    heading: string;
    links: Array<{ label: string; href: string; external?: boolean }>;
  }> = [
    {
      heading: dict.footer.companyHeading,
      links: [
        { label: dict.footer.aboutUs, href: `${prefix}/about` },
        { label: dict.footer.careers, href: `${prefix}/careers` },
        { label: dict.footer.contact, href: `${prefix}/contact` },
      ],
    },
    {
      heading: dict.footer.productsHeading,
      links: [
        { label: dict.nav.products, href: `${prefix}/products` },
        { label: dict.nav.solutions, href: `${prefix}/solutions` },
      ],
    },
    {
      heading: dict.footer.resourcesHeading,
      links: [
        { label: dict.nav.blog, href: `${prefix}/blog` },
        { label: dict.nav.resources, href: `${prefix}/resources` },
      ],
    },
    {
      heading: dict.footer.legalHeading,
      links: [
        { label: dict.footer.privacy, href: `${prefix}/privacy` },
        { label: dict.footer.terms, href: `${prefix}/terms` },
        { label: dict.footer.cookies, href: `${prefix}/cookies` },
      ],
    },
  ];

  return (
    <footer className="bg-kron-dark text-slate-300">
      <div className="container py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="space-y-4">
            <Logo locale={locale} variant="white" />
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              {dict.footer.tagline}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                {col.heading}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href as '/'}
                      className="text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Offices */}
        {offices.length > 0 ? (
          <div className="mt-14 border-t border-white/10 pt-10">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              {dict.footer.officesHeading}
            </h3>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {offices.map((office) => (
                <article key={office.id} className="text-sm text-slate-400">
                  <h4 className="mb-2 text-base font-semibold text-white">{office.city}</h4>
                  <p className="mb-1 whitespace-pre-line">{office.address}</p>
                  <p className="mb-1">
                    <span className="text-slate-500">{dict.common.phone}: </span>
                    <a href={`tel:${office.phone}`} className="hover:text-white">
                      {office.phone}
                    </a>
                  </p>
                  {office.fax ? (
                    <p className="mb-1">
                      <span className="text-slate-500">{dict.common.fax}: </span>
                      {office.fax}
                    </p>
                  ) : null}
                  <p>
                    <span className="text-slate-500">{dict.common.email}: </span>
                    <a href={`mailto:${office.email}`} className="hover:text-white">
                      {office.email}
                    </a>
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-14 border-t border-white/10 pt-6 text-sm text-slate-500">
          {dict.footer.copyright.replace('{year}', String(year))}
        </div>
      </div>
    </footer>
  );
}

async function fetchOffices(locale: Locale): Promise<Office[]> {
  try {
    return await sfetch<Office[]>(`/offices?locale=${locale}`, {
      tags: ['offices'],
      revalidate: 600, // 10 dk — backend'le uyumlu
    });
  } catch {
    return [];
  }
}
