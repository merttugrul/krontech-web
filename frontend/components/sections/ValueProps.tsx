import type { Dictionary } from '@/lib/i18n';
import { Icon } from '@/components/ui/Icon';

interface ValuePropsProps {
  dict: Dictionary;
}

/**
 * "Neden Kron?" bloğu. İçerik tamamen statik (i18n sözlük); backend'e gitmez.
 * 4 kart grid: lg 4-col, md 2-col, sm 1-col.
 */
export function ValueProps({ dict }: ValuePropsProps) {
  const h = dict.home;

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-balance">{h.valuePropsHeading}</h2>
          <p className="text-pretty text-lg text-slate-600">
            {h.valuePropsSubheading}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {h.valueProps.map((vp) => (
            <article
              key={vp.title}
              className="rounded-2xl border border-slate-200 bg-kron-gray p-6 transition-colors hover:border-kron-accent"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-kron-accent/10 text-kron-accent">
                <Icon name={vp.icon} size={24} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-kron-dark">
                {vp.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {vp.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
