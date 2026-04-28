import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/jsonld';

describe('buildOrganizationJsonLd', () => {
  it('Schema.org Organization tipinde ve site URL dinamik olmalı', () => {
    const data = buildOrganizationJsonLd('https://kron.example');
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('Organization');
    expect(data.url).toBe('https://kron.example');
    expect(data.logo).toBe('https://kron.example/logo.png');
    expect(Array.isArray(data.sameAs)).toBe(true);
  });

  it('contactPoint içinde müşteri desteği email bulunmalı', () => {
    const data = buildOrganizationJsonLd('https://kron.example');
    const contactPoints = data.contactPoint as Array<Record<string, unknown>>;
    expect(contactPoints[0]?.contactType).toBe('customer support');
    expect(contactPoints[0]?.email).toBeDefined();
  });
});

describe('buildWebsiteJsonLd', () => {
  it('WebSite tipinde ve inLanguage EN + TR içermeli', () => {
    const data = buildWebsiteJsonLd('https://kron.example');
    expect(data['@type']).toBe('WebSite');
    expect(data.inLanguage).toEqual(['en', 'tr']);
    expect(data.url).toBe('https://kron.example');
  });

  it('SearchAction urlTemplate site URL\'i içerir', () => {
    const data = buildWebsiteJsonLd('https://kron.example');
    const action = data.potentialAction as Record<string, unknown>;
    const target = action.target as Record<string, unknown>;
    expect(target.urlTemplate).toBe(
      'https://kron.example/search?q={search_term_string}',
    );
  });
});
