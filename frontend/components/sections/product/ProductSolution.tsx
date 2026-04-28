import type { ProductSolution } from '@/lib/schemas/product-detail';
import { Icon } from '@/components/ui/Icon';

interface ProductSolutionProps {
  data: ProductSolution;
  defaultHeading: string;
}

export function ProductSolutionSection({ data, defaultHeading }: ProductSolutionProps) {
  return (
    <section className="section bg-white">
      <div className="container-tight">
        <h2 className="mb-6 text-balance">{data.heading ?? defaultHeading}</h2>
        <p className="text-pretty text-lg leading-relaxed text-slate-600">
          {data.description}
        </p>

        {data.bullets && data.bullets.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {data.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-kron-accent/10 text-kron-accent">
                  <Icon name="check" size={14} />
                </span>
                <span className="text-base leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
