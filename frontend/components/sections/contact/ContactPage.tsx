import { sfetch } from '@/lib/api';
import type { Locale, Office } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ContactForm } from '@/components/forms/ContactForm';
import { RecaptchaWrapper } from '@/components/forms/RecaptchaWrapper';

interface ContactPageProps {
  locale: Locale;
}

/**
 * Contact page composer (RSC). Sağ sütunda form, sol sütunda ofisler listesi.
 * Mobile'da kolonlar stack'lenir — form üstte.
 *
 * Office verileri `sfetch` ile cache'lenir (ISR ~60 sn); hata durumunda boş state.
 */
export async function ContactPage({ locale }: ContactPageProps) {
  const dict = getDictionary(locale);
  const t = dict.contact;
  const prefix = localePrefix(locale);
  const offices = await fetchOffices(locale);

  return (
    <>
      <section className="bg-kron-hero pt-28 text-white sm:pt-32">
        <div className="container py-14 sm:py-20">
          <Breadcrumb
            items={[
              { label: t.breadcrumbHome, href: prefix || '/' },
              { label: t.breadcrumbContact },
            ]}
            variant="white"
            className="mb-8"
          />
          <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-kron-light">
            {t.heroEyebrow}
          </span>
          <h1 className="max-w-3xl text-balance font-semibold text-white">
            {t.contactTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-slate-300">
            {t.contactSubtitle}
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
            <aside className="order-2 lg:order-1">
              <h2 className="mb-6 text-2xl font-semibold text-kron-dark">
                {t.officesHeading}
              </h2>
              {offices.length === 0 ? (
                <p className="text-slate-500">{t.officesEmpty}</p>
              ) : (
                <ul className="space-y-6">
                  {offices.map((office) => (
                    <OfficeCard key={office.id} office={office} dict={dict} />
                  ))}
                </ul>
              )}
            </aside>

            <div className="order-1 lg:order-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
                <RecaptchaWrapper>
                  <ContactForm locale={locale} dict={dict} />
                </RecaptchaWrapper>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function OfficeCard({
  office,
  dict,
}: {
  office: Office;
  dict: ReturnType<typeof getDictionary>;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-kron-gray p-5">
      <h3 className="mb-3 text-base font-semibold text-kron-dark">
        {office.city}
      </h3>
      <dl className="space-y-2 text-sm text-slate-600">
        <div>
          <dt className="sr-only">{dict.common.address}</dt>
          <dd className="text-pretty">{office.address}</dd>
        </div>
        {office.email ? (
          <div>
            <dt className="sr-only">{dict.common.email}</dt>
            <dd>
              <a
                href={`mailto:${office.email}`}
                className="text-kron-accent hover:underline"
              >
                {office.email}
              </a>
            </dd>
          </div>
        ) : null}
        {office.phone ? (
          <div>
            <dt className="sr-only">{dict.common.phone}</dt>
            <dd>
              <a
                href={`tel:${office.phone.replace(/\s/g, '')}`}
                className="text-kron-accent hover:underline"
              >
                {office.phone}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}

async function fetchOffices(locale: Locale): Promise<Office[]> {
  try {
    return await sfetch<Office[]>(`/offices?locale=${locale}`, {
      tags: ['offices'],
      revalidate: 60,
    });
  } catch {
    return [];
  }
}
