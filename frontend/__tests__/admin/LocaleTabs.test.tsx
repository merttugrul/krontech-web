/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleTabs } from '@/components/admin/LocaleTabs';

describe('LocaleTabs', () => {
  it('aktif sekme aria-selected=true olur', () => {
    render(<LocaleTabs value="en" onChange={() => {}} />);
    const en = screen.getByRole('tab', { name: /English/ });
    const tr = screen.getByRole('tab', { name: /Türkçe/ });
    expect(en).toHaveAttribute('aria-selected', 'true');
    expect(tr).toHaveAttribute('aria-selected', 'false');
  });

  it('tıklanınca onChange çağrılır', () => {
    const onChange = jest.fn();
    render(<LocaleTabs value="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Türkçe/ }));
    expect(onChange).toHaveBeenCalledWith('tr');
  });

  it('hasError varsa kırmızı dot render eder', () => {
    render(<LocaleTabs value="en" onChange={() => {}} hasError={{ tr: true }} />);
    expect(screen.getByLabelText('Bu dilde hata var')).toBeInTheDocument();
  });

  it('EN sekmesi "Zorunlu" etiketi gösterir', () => {
    render(<LocaleTabs value="en" onChange={() => {}} />);
    expect(screen.getByText(/Zorunlu/)).toBeInTheDocument();
  });
});
