import {
  youtubeEmbedUrl,
  type ProductVideos,
} from '@/lib/schemas/product-detail';

interface ProductVideosProps {
  data: ProductVideos;
  defaultHeading: string;
}

/**
 * Responsive YouTube embed grid. `iframe` `loading="lazy"` ile geç yüklenir.
 *
 * Erişilebilirlik: her iframe'e `title` veriyoruz (YouTube embed'inin
 * default title'ı hem ingilizce hem jenerik — kendi başlığımızı koyuyoruz).
 */
export function ProductVideosSection({ data, defaultHeading }: ProductVideosProps) {
  const valid = data.items
    .map((item) => ({ ...item, embed: youtubeEmbedUrl(item.youtubeUrl) }))
    .filter((v): v is typeof v & { embed: string } => v.embed !== null);

  if (valid.length === 0) return null;

  return (
    <section className="section bg-kron-gray">
      <div className="container">
        <h2 className="mb-12 text-center text-balance">
          {data.heading ?? defaultHeading}
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {valid.map((video, idx) => (
            <figure
              key={`${video.title}-${idx}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
            >
              <div className="relative aspect-video w-full">
                <iframe
                  src={video.embed}
                  title={video.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <figcaption className="px-5 py-4 text-sm font-medium text-kron-dark">
                {video.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
