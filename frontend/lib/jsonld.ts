/**
 * Site-level JSON-LD yardımcıları. Her page kendi Article/Product/Breadcrumb
 * JSON-LD'sini ekler; buradaki builder'lar `Organization` ve `WebSite` gibi
 * global schema'lar için — Root layout'ta bir kez basılır ve tüm sayfalarda
 * tekrar etmez (child sayfalardaki JSON-LD'ler ek layer olarak çalışır).
 */

export function buildOrganizationJsonLd(siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Krontech',
    alternateName: 'Kron',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://www.linkedin.com/company/krontech',
      'https://twitter.com/krontech',
      'https://www.youtube.com/@krontech',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'info@krontech.com',
        availableLanguage: ['English', 'Turkish'],
      },
    ],
  };
}

export function buildWebsiteJsonLd(siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Krontech',
    url: siteUrl,
    inLanguage: ['en', 'tr'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
