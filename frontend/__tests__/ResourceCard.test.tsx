import { render, screen } from '@testing-library/react';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { getDictionary } from '@/lib/i18n';
import type { Resource } from '@/lib/types';

const base: Resource = {
  id: 'res-1',
  type: 'datasheet',
  productId: null,
  coverImage: null,
  fileUrl: 'https://cdn.example.com/ds.pdf',
  locale: 'en',
  title: 'Single Connect Datasheet',
  description: 'Technical overview of PAM capabilities and deployment modes.',
  status: 'published',
  order: 0,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
};

describe('<ResourceCard />', () => {
  const dict = getDictionary('en');

  it('başlık, type badge ve açıklama render edilir', () => {
    render(<ResourceCard resource={base} locale="en" dict={dict} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Single Connect Datasheet' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Technical overview/)).toBeInTheDocument();
    expect(screen.getByText(dict.resources.typeDatasheet)).toBeInTheDocument();
  });

  it('fileUrl mevcutsa indirme link\'i doğru href ile render edilir', () => {
    render(<ResourceCard resource={base} locale="en" dict={dict} />);
    const downloadLink = screen.getByRole('link', {
      name: new RegExp(dict.resources.downloadCta),
    });
    expect(downloadLink).toHaveAttribute('href', 'https://cdn.example.com/ds.pdf');
    expect(downloadLink).toHaveAttribute('target', '_blank');
    expect(downloadLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('fileUrl null ise indirme link\'i render edilmez', () => {
    render(
      <ResourceCard
        resource={{ ...base, fileUrl: null }}
        locale="en"
        dict={dict}
      />,
    );
    expect(
      screen.queryByRole('link', { name: new RegExp(dict.resources.downloadCta) }),
    ).toBeNull();
  });

  it('TR locale için detay link\'i /tr prefix alır', () => {
    const trDict = getDictionary('tr');
    render(<ResourceCard resource={base} locale="tr" dict={trDict} />);
    const detailLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.startsWith('/tr/resources/'));
    expect(detailLinks.length).toBeGreaterThan(0);
    expect(detailLinks[0]!.getAttribute('href')).toBe('/tr/resources/res-1');
  });
});
