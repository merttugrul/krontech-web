import type { ProductKeyBenefits } from '@/lib/schemas/product-detail';
import { Icon } from '@/components/ui/Icon';

interface ProductKeyBenefitsProps {
  data: ProductKeyBenefits;
  defaultHeading: string;
}

export function ProductKeyBenefitsSection({ data, defaultHeading }: ProductKeyBenefitsProps) {
  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="mb-12 text-center text-balance">
          {data.heading ?? defaultHeading}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, idx) => (
            <article
              key={`${item.title}-${idx}`}
              className="rounded-2xl border border-slate-200 bg-kron-gray p-6 transition-colors hover:border-kron-accent"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-kron-accent/10 text-kron-accent">
                <Icon name={item.icon ?? 'check'} size={24} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-kron-dark">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
