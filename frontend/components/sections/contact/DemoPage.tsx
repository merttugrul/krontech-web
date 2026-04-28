import type { Locale } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { DemoForm } from '@/components/forms/DemoForm';
import { RecaptchaWrapper } from '@/components/forms/RecaptchaWrapper';
import { Icon } from '@/components/ui/Icon';

interface DemoPageProps {
  locale: Locale;
}

/**
 * Demo request sayfası. Contact'tan farklı olarak "value prop" sütun
 * içerir — demo beklentilerini kullanıcıya anlatır.
 */
export async function DemoPage({ locale }: DemoPageProps) {
  const dict = getDictionary(locale);
  const t = dict.contact;
  const prefix = localePrefix(locale);

  const bullets: Array<{
    icon: 'shield' | 'bolt' | 'graph' | 'check';
    title: string;
    description: string;
  }> = locale === 'tr'
    ? [
        {
          icon: 'shield',
          title: 'Kişiye özel senaryo',
          description:
            'Kullanım ortamınıza uygun canlı bir senaryo hazırlayıp birlikte yürürüz.',
        },
        {
          icon: 'bolt',
          title: '30 dakika içinde aksiyon',
          description:
            'Ortalama 30 dakikalık oturumda çözümü çalışır halde görürsünüz.',
        },
        {
          icon: 'graph',
          title: 'Teknik derinlik',
          description:
            'Mimariyi, entegrasyonları ve ölçeklenme senaryolarını sorgulayın.',
        },
        {
          icon: 'check',
          title: 'Takip eden teklif',
          description:
            'Oturum sonunda ekibiniz için maliyet ve yol haritasını hazırlarız.',
        },
      ]
    : [
        {
          icon: 'shield',
          title: 'Tailored scenario',
          description:
            'We run a live walkthrough mapped to your environment and threat model.',
        },
        {
          icon: 'bolt',
          title: 'Actionable in 30 minutes',
          description:
            'Average session length is 30 minutes — you leave with a working picture.',
        },
        {
          icon: 'graph',
          title: 'Deep technical Q&A',
          description:
            'Ask about architecture, integrations, and scaling scenarios.',
        },
        {
          icon: 'check',
          title: 'Follow-up proposal',
          description:
            'After the call we prepare a cost estimate and rollout plan for your team.',
        },
      ];

  return (
    <>
      <section className="bg-kron-hero pt-28 text-white sm:pt-32">
        <div className="container py-14 sm:py-20">
          <Breadcrumb
            items={[
              { label: t.breadcrumbHome, href: prefix || '/' },
              { label: t.breadcrumbDemo },
            ]}
            variant="white"
            className="mb-8"
          />
          <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-kron-light">
            {t.heroEyebrow}
          </span>
          <h1 className="max-w-3xl text-balance font-semibold text-white">
            {t.demoTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-slate-300">
            {t.demoSubtitle}
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
            <aside className="order-2 lg:order-1">
              <ul className="space-y-5">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-kron-50 text-kron-accent">
                      <Icon name={b.icon} size={20} />
                    </span>
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-kron-dark">
                        {b.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {b.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="order-1 lg:order-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
                <RecaptchaWrapper>
                  <DemoForm locale={locale} dict={dict} />
                </RecaptchaWrapper>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
