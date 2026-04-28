import type { ProductHowItWorks } from '@/lib/schemas/product-detail';

interface ProductHowItWorksProps {
  data: ProductHowItWorks;
  defaultHeading: string;
}

/**
 * Numbered-steps grid. Büyük ekranda horizontal, küçükte vertical stacked.
 * Her adımın numarası accent renkli yuvarlak rozet.
 */
export function ProductHowItWorksSection({ data, defaultHeading }: ProductHowItWorksProps) {
  return (
    <section className="section bg-kron-gray">
      <div className="container">
        <h2 className="mb-12 text-center text-balance">
          {data.heading ?? defaultHeading}
        </h2>

        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.steps.map((step, idx) => (
            <li
              key={`${step.title}-${idx}`}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-kron-accent text-base font-semibold text-white">
                {idx + 1}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-kron-dark">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
