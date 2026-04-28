import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ui/ProductCard';
import type { ProductListItem } from '@/lib/types';

const base: ProductListItem = {
  id: 'p1',
  slug: 'telemetry-pipeline',
  order: 0,
  publishedAt: '2026-01-01T00:00:00.000Z',
  category: { slug: 'observability', name: 'Observability' },
  title: 'Telemetry Pipeline',
  shortDescription: 'Ingest, parse, route at scale.',
  ogImage: null,
};

describe('<ProductCard />', () => {
  it('başlık ve kategori render edilir', () => {
    render(<ProductCard product={base} locale="en" ctaLabel="Learn more" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Telemetry Pipeline' })).toBeInTheDocument();
    expect(screen.getByText('Observability')).toBeInTheDocument();
    expect(screen.getByText('Learn more')).toBeInTheDocument();
  });

  it('EN locale için href prefix yoktur', () => {
    render(<ProductCard product={base} locale="en" ctaLabel="Learn more" />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/products/telemetry-pipeline',
    );
  });

  it('TR locale için href /tr prefix alır', () => {
    render(<ProductCard product={base} locale="tr" ctaLabel="Daha fazla" />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/tr/products/telemetry-pipeline',
    );
  });

  it('ogImage yoksa placeholder (ilk harf) render edilir', () => {
    render(<ProductCard product={base} locale="en" ctaLabel="Learn more" />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('uzun shortDescription truncate edilir (… ile biter)', () => {
    const longDesc = 'A'.repeat(200);
    render(
      <ProductCard
        product={{ ...base, shortDescription: longDesc }}
        locale="en"
        ctaLabel="Learn more"
      />,
    );
    const paragraph = screen.getByText(/A+…$/);
    expect(paragraph.textContent?.length ?? 0).toBeLessThanOrEqual(140);
  });
});
