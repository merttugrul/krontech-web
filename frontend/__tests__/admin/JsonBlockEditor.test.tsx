/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonBlockEditor } from '@/components/admin/JsonBlockEditor';

function Wrapper({ initial }: { initial: unknown }) {
  return <JsonBlockEditor label="Solution" value={initial} onChange={() => {}} />;
}

describe('JsonBlockEditor', () => {
  it('value prop JSON.stringify ile textarea içine basılır', () => {
    render(<Wrapper initial={{ description: 'Hello' }} />);
    const ta = screen.getByLabelText('Solution') as HTMLTextAreaElement;
    expect(ta.value).toContain('Hello');
  });

  it('null değeri boş textarea olur', () => {
    render(<Wrapper initial={null} />);
    const ta = screen.getByLabelText('Solution') as HTMLTextAreaElement;
    expect(ta.value).toBe('');
  });

  it('geçersiz JSON blur sonrası hata gösterir', () => {
    const onChange = jest.fn();
    render(<JsonBlockEditor label="Solution" value={null} onChange={onChange} />);
    const ta = screen.getByLabelText('Solution') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '{ bad json' } });
    fireEvent.blur(ta);
    expect(screen.getByRole('alert').textContent).toMatch(/Geçersiz JSON/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('geçerli JSON blur sonrası onChange çağrılır', () => {
    const onChange = jest.fn();
    render(<JsonBlockEditor label="Solution" value={null} onChange={onChange} />);
    const ta = screen.getByLabelText('Solution') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '{"description":"X"}' } });
    fireEvent.blur(ta);
    expect(onChange).toHaveBeenCalledWith({ description: 'X' });
  });

  it('boş string blur sonrası emptyAs=null → onChange(null)', () => {
    const onChange = jest.fn();
    render(<JsonBlockEditor label="Solution" value={{ a: 1 }} onChange={onChange} />);
    const ta = screen.getByLabelText('Solution') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '' } });
    fireEvent.blur(ta);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
