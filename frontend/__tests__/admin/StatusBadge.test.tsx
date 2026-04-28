/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/admin/StatusBadge';

describe('StatusBadge', () => {
  it('draft → "Taslak" gösterir', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('Taslak')).toBeInTheDocument();
  });

  it('published → "Yayında" gösterir', () => {
    render(<StatusBadge status="published" />);
    expect(screen.getByText('Yayında')).toBeInTheDocument();
  });

  it('scheduled → "Planlı" gösterir', () => {
    render(<StatusBadge status="scheduled" />);
    expect(screen.getByText('Planlı')).toBeInTheDocument();
  });
});
