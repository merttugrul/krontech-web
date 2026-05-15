import Link from 'next/link';
import type { Locale, Resource } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { localePrefix, truncate } from '@/lib/utils';
import { resourceTypeLabel } from '@/lib/resources';
import { Icon } from './Icon';

interface ResourceCardProps {
  resource: Resource;
  locale: Locale;
  dict: Dictionary;
}

/**
 * Kaynak kartı: cover image + type badge + title + description +
 * 2 CTA (detay sayfası + direkt PDF indir). Blog kartından farklı
 * olarak iki ana aksiyon taşır — kullanıcıya hem önizleme hem hızlı
 * indirme yolu sunar.
 */
export function ResourceCard({ resource, locale, dict }: ResourceCardProps) {
  const detailHref = `${localePrefix(locale)}/resources/${resource.id}`;
  const label = resourceTypeLabel(resource.type, dict);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover">
      <Link
        href={detailHref as '/'}
        aria-label={resource.title}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-kron-blue via-kron-accent to-kron-light"
      >
        {resource.coverImage ? (
          <img
            src={resource.coverImage}
            alt={resource.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Icon name="graph" size={56} />
          </div>
        )}
        <span className="absolute left-4 top-4 inline-block rounded-full bg-white/95 px-3 py-1 text-xs font-medium uppercase tracking-wider text-kron-accent">
          {label}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <Link href={detailHref as '/'} className="focus-visible:outline-none">
          <h3 className="mb-3 text-lg font-semibold leading-snug text-kron-dark transition-colors group-hover:text-kron-accent">
            {resource.title}
          </h3>
        </Link>

        {resource.description ? (
          <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600">
            {truncate(resource.description, 140)}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-3">
          <Link
            href={detailHref as '/'}
            className="inline-flex items-center gap-1 text-sm font-medium text-kron-accent transition-colors hover:text-kron-blue"
          >
            {dict.resources.viewDetailCta}
            <Icon
              name="arrow-right"
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          {resource.fileUrl ? (
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-kron-dark transition-colors hover:border-kron-accent hover:text-kron-accent"
              aria-label={`${dict.resources.downloadCta}: ${resource.title}`}
            >
              <Icon name="arrow-right" size={12} className="rotate-90" />
              {dict.resources.downloadCta}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
