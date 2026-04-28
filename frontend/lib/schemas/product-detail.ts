import { z } from 'zod';

/**
 * Ürün detay sayfasındaki JSON blokları için güvenli parse katmanı.
 *
 * Backend `solution`, `howItWorks`, `keyBenefits`, `productFamily`, `videos`
 * alanlarını `unknown` JSON olarak saklıyor. Admin panel (ADIM 19) bu
 * alanları editör ile dolduruyor — şekil sözleşmesi frontend tarafında
 * burada dondu.
 *
 * Her parse fonksiyonu `safeParse` kullanır, hata durumunda `null` döner.
 * Komponentler null geldiğinde ilgili bölümü **hiç render etmez** — böylece
 * boş ya da bozuk veri sayfayı patlatmaz.
 *
 * Dışa açık API:
 *   parseSolution(), parseHowItWorks(), parseKeyBenefits(),
 *   parseProductFamily(), parseVideos()
 */

// ─────────────────────────────────────
// Solution
// ─────────────────────────────────────
export const solutionSchema = z.object({
  heading: z.string().min(1).optional(),
  description: z.string().min(1),
  bullets: z.array(z.string().min(1)).optional(),
});
export type ProductSolution = z.infer<typeof solutionSchema>;

// ─────────────────────────────────────
// How it works
// ─────────────────────────────────────
export const howItWorksStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});
export const howItWorksSchema = z.object({
  heading: z.string().min(1).optional(),
  steps: z.array(howItWorksStepSchema).min(1),
});
export type ProductHowItWorks = z.infer<typeof howItWorksSchema>;

// ─────────────────────────────────────
// Key benefits
// ─────────────────────────────────────
const BENEFIT_ICONS = ['shield', 'bolt', 'graph', 'globe', 'check'] as const;
export type BenefitIcon = (typeof BENEFIT_ICONS)[number];

// Bilinmeyen icon değeri geldiğinde tüm bloğu düşürmek yerine 'check' fallback'a
// çekiyoruz. `transform` ile tip güvenli (output'u BenefitIcon).
const benefitIconSchema = z
  .string()
  .transform<BenefitIcon>((v) =>
    (BENEFIT_ICONS as readonly string[]).includes(v) ? (v as BenefitIcon) : 'check',
  );

export const keyBenefitItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: benefitIconSchema.optional(),
});
export const keyBenefitsSchema = z.object({
  heading: z.string().min(1).optional(),
  items: z.array(keyBenefitItemSchema).min(1),
});
export type ProductKeyBenefits = z.infer<typeof keyBenefitsSchema>;

// ─────────────────────────────────────
// Product family (ilişkili ürünler — slug listesi)
// ─────────────────────────────────────
export const productFamilySchema = z.object({
  heading: z.string().min(1).optional(),
  slugs: z.array(z.string().min(1)).min(1),
});
export type ProductFamily = z.infer<typeof productFamilySchema>;

// ─────────────────────────────────────
// Videos
// ─────────────────────────────────────
export const videoItemSchema = z.object({
  title: z.string().min(1),
  youtubeUrl: z
    .string()
    .url()
    .refine(
      (v) => /youtube\.com|youtu\.be/i.test(v),
      'Yalnızca YouTube URL desteklenir',
    ),
});
export const videosSchema = z.object({
  heading: z.string().min(1).optional(),
  items: z.array(videoItemSchema).min(1),
});
export type ProductVideos = z.infer<typeof videosSchema>;
export type VideoItem = z.infer<typeof videoItemSchema>;

// ─────────────────────────────────────
// Parse helpers — her zaman null'a düşer (exception fırlatmaz)
// ─────────────────────────────────────

function safeParse<S extends z.ZodTypeAny>(schema: S, raw: unknown): z.infer<S> | null {
  const result = schema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseSolution(raw: unknown): ProductSolution | null {
  return safeParse(solutionSchema, raw);
}
export function parseHowItWorks(raw: unknown): ProductHowItWorks | null {
  return safeParse(howItWorksSchema, raw);
}
export function parseKeyBenefits(raw: unknown): ProductKeyBenefits | null {
  return safeParse(keyBenefitsSchema, raw);
}
export function parseProductFamily(raw: unknown): ProductFamily | null {
  return safeParse(productFamilySchema, raw);
}
export function parseVideos(raw: unknown): ProductVideos | null {
  return safeParse(videosSchema, raw);
}

/**
 * YouTube URL → `https://www.youtube.com/embed/{id}` embed formatı.
 * Desteklenen pattern'lar:
 *   - https://www.youtube.com/watch?v=ID
 *   - https://youtu.be/ID
 *   - https://www.youtube.com/embed/ID
 *
 * Geçersiz input için `null` döner (komponent skip eder).
 */
export function youtubeEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    let id: string | null = null;
    if (url.hostname === 'youtu.be') {
      id = url.pathname.replace(/^\/+/, '').split('/')[0] ?? null;
    } else if (/(^|\.)youtube\.com$/i.test(url.hostname)) {
      if (url.pathname === '/watch') {
        id = url.searchParams.get('v');
      } else if (url.pathname.startsWith('/embed/')) {
        id = url.pathname.replace('/embed/', '').split('/')[0] ?? null;
      } else if (url.pathname.startsWith('/shorts/')) {
        id = url.pathname.replace('/shorts/', '').split('/')[0] ?? null;
      }
    }
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}
