import { render, screen } from '@testing-library/react';
import { Pagination, computeVisiblePages } from '@/components/ui/Pagination';

const labels = { prev: 'Prev', next: 'Next', page: 'Page' };

describe('computeVisiblePages', () => {
  it('total ≤ 7 ise hepsini listeler', () => {
    expect(computeVisiblePages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(computeVisiblePages(1, 1)).toEqual([1]);
  });

  it('başlarda ellipsis sağda', () => {
    expect(computeVisiblePages(1, 20)).toEqual([1, 2, '…', 20]);
  });

  it('sonlarda ellipsis solda', () => {
    expect(computeVisiblePages(20, 20)).toEqual([1, '…', 19, 20]);
  });

  it('ortada iki yanda ellipsis', () => {
    expect(computeVisiblePages(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
  });
});

describe('Pagination', () => {
  it('total=1 ise render etmez', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} basePath="/blog" labels={labels} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('mevcut sayfa aria-current="page" alır', () => {
    render(
      <Pagination currentPage={2} totalPages={5} basePath="/blog" labels={labels} />,
    );
    const current = screen.getByText('2');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('ilk sayfa için href=/blog (page paramı yok)', () => {
    render(
      <Pagination currentPage={3} totalPages={5} basePath="/blog" labels={labels} />,
    );
    const first = screen.getByText('1').closest('a');
    expect(first).toHaveAttribute('href', '/blog');
  });

  it('page > 1 için ?page=N query eklenir', () => {
    render(
      <Pagination currentPage={1} totalPages={5} basePath="/blog" labels={labels} />,
    );
    const third = screen.getByText('3').closest('a');
    expect(third).toHaveAttribute('href', '/blog?page=3');
  });

  it('extraQuery korunur, page eklenir', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        basePath="/blog"
        extraQuery="highlight=1"
        labels={labels}
      />,
    );
    const second = screen.getByText('2').closest('a');
    expect(second).toHaveAttribute('href', '/blog?highlight=1&page=2');
  });
});
