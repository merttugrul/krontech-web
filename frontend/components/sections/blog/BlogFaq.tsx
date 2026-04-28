import { JsonLd } from '@/components/seo/JsonLd';

interface FaqItem {
  question: string;
  answer: string;
}

interface BlogFaqProps {
  items: FaqItem[];
  heading: string;
}

/**
 * FAQ listesi + `FAQPage` JSON-LD. HTML `<details>` element'i ile
 * vanilla accordion — JS yok, SSG friendly.
 *
 * `answer` düz metin kabul ediliyor (TipTap editöründe FAQ alanını
 * plain text tutuyoruz; HTML injection için sanitize gerekmez).
 */
export function BlogFaq({ items, heading }: BlogFaqProps) {
  if (items.length === 0) return null;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  };

  return (
    <section className="section bg-kron-gray">
      <JsonLd data={jsonLd} />
      <div className="container-tight">
        <h2 className="mb-8 text-balance">{heading}</h2>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <details
              key={`${item.question}-${idx}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium text-kron-dark">
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-kron-accent transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-4 text-sm leading-relaxed text-slate-600">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
