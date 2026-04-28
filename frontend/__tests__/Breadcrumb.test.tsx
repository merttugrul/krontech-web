import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

describe('Breadcrumb', () => {
  it('tüm itemları sırayla render eder', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'KronSuite' },
        ]}
      />,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('KronSuite')).toBeInTheDocument();
  });

  it('son item aria-current="page" alır ve link değildir', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Current' },
        ]}
      />,
    );
    const current = screen.getByText('Current');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).toBe('SPAN');
  });

  it('href verilen itemlar Link olarak render edilir', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'Detail' },
        ]}
      />,
    );
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    const productsLink = screen.getByText('Products').closest('a');
    expect(productsLink).toHaveAttribute('href', '/products');
  });

  it('boş items → hiç render etmez', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('separator sayısı item sayısından 1 az', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'A', href: '/' },
          { label: 'B', href: '/b' },
          { label: 'C' },
        ]}
      />,
    );
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2);
  });
});
