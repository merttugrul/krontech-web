import { render, screen } from '@testing-library/react';
import { Highlight } from '@/components/ui/Highlight';

describe('<Highlight />', () => {
  it('default variant → `hl` class (alt-çubuk)', () => {
    render(<Highlight>Telemetry Pipeline</Highlight>);
    const span = screen.getByText('Telemetry Pipeline');
    expect(span).toHaveClass('hl');
    expect(span).not.toHaveClass('hl-underline');
  });

  it('variant="underline" → `hl-underline` class', () => {
    render(<Highlight variant="underline">Preview</Highlight>);
    const span = screen.getByText('Preview');
    expect(span).toHaveClass('hl-underline');
    expect(span).not.toHaveClass('hl');
  });

  it('extra className prop merge edilir', () => {
    render(
      <Highlight className="extra-class">
        Custom
      </Highlight>,
    );
    const span = screen.getByText('Custom');
    expect(span).toHaveClass('hl');
    expect(span).toHaveClass('extra-class');
  });

  it('children metni render edilir (erişilebilirlik)', () => {
    render(
      <h1>
        Kron <Highlight>Telemetry Pipeline</Highlight> for Security
      </h1>,
    );
    // Screen reader'a sözcükler satır olarak düzgün dökülmeli
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Kron Telemetry Pipeline for Security',
    );
  });
});
