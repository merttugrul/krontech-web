import { render, screen, fireEvent, act } from '@testing-library/react';
import { Navbar } from '@/components/layout/Navbar';
import { getDictionary } from '@/lib/i18n';

// Next navigation hook mock — jest-environment-jsdom'da mevcut değil.
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));
import { usePathname } from 'next/navigation';

describe('<Navbar />', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('desktop navigation linkleri dictionary etiketleriyle render edilir (EN)', () => {
    render(<Navbar locale="en" dictionary={getDictionary('en')} />);
    expect(screen.getAllByText('Products').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Solutions').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resources').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Blog').length).toBeGreaterThan(0);
  });

  it('TR locale için nav etiketleri Türkçe gelir', () => {
    render(<Navbar locale="tr" dictionary={getDictionary('tr')} />);
    expect(screen.getAllByText('Ürünler').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Çözümler').length).toBeGreaterThan(0);
  });

  it('hamburger kapalıyken aria-expanded=false, tıklayınca true', () => {
    render(<Navbar locale="en" dictionary={getDictionary('en')} />);
    const btn = screen.getByRole('button', { name: /open menu/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    act(() => {
      fireEvent.click(btn);
    });

    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('aktif rotada aria-current=page set edilir', () => {
    (usePathname as jest.Mock).mockReturnValue('/products');
    render(<Navbar locale="en" dictionary={getDictionary('en')} />);

    // Desktop + mobile set; en az bir tanesi aria-current olmalı
    const productsLinks = screen.getAllByRole('link', { name: 'Products' });
    expect(productsLinks.some((l) => l.getAttribute('aria-current') === 'page')).toBe(true);
  });

  it('TR locale nav href prefix /tr ile başlar', () => {
    render(<Navbar locale="tr" dictionary={getDictionary('tr')} />);
    const productsLink = screen.getAllByRole('link', { name: 'Ürünler' })[0];
    expect(productsLink?.getAttribute('href')).toBe('/tr/products');
  });
});
