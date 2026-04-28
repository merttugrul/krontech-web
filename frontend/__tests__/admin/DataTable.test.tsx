/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminPagination, DataTable, type ColumnDef } from '@/components/admin/DataTable';

interface Row {
  id: string;
  name: string;
}

const columns: ColumnDef<Row>[] = [
  { key: 'name', header: 'Ad', render: (r) => r.name },
];

describe('DataTable', () => {
  it('rows boşken emptyMessage gösterir', () => {
    render(
      <DataTable<Row>
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        emptyMessage="Kayıt yok."
      />,
    );
    expect(screen.getByText('Kayıt yok.')).toBeInTheDocument();
  });

  it('rows gelince render edilir', () => {
    render(
      <DataTable<Row>
        columns={columns}
        rows={[
          { id: '1', name: 'Ürün A' },
          { id: '2', name: 'Ürün B' },
        ]}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText('Ürün A')).toBeInTheDocument();
    expect(screen.getByText('Ürün B')).toBeInTheDocument();
  });

  it('onRowClick tıklayınca row ile çağrılır', () => {
    const onClick = jest.fn();
    render(
      <DataTable<Row>
        columns={columns}
        rows={[{ id: '1', name: 'Ürün A' }]}
        rowKey={(r) => r.id}
        onRowClick={onClick}
      />,
    );
    fireEvent.click(screen.getByText('Ürün A'));
    expect(onClick).toHaveBeenCalledWith({ id: '1', name: 'Ürün A' });
  });
});

describe('AdminPagination', () => {
  it('tek sayfa ise render etmez', () => {
    const { container } = render(
      <AdminPagination page={1} pageSize={10} total={5} onPageChange={() => {}} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('sayfa sayısını ve toplamı gösterir', () => {
    render(
      <AdminPagination page={2} pageSize={10} total={35} onPageChange={() => {}} />,
    );
    // "11–20 / 35 kayıt"
    expect(screen.getByText(/11/)).toBeInTheDocument();
    expect(screen.getByText(/20/)).toBeInTheDocument();
    expect(screen.getByText(/35/)).toBeInTheDocument();
  });

  it('Sonraki butonu tıklayınca callback çağrılır', () => {
    const onChange = jest.fn();
    render(
      <AdminPagination page={1} pageSize={10} total={30} onPageChange={onChange} />,
    );
    fireEvent.click(screen.getByText(/Sonraki/));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('ilk sayfada Önceki disabled', () => {
    render(
      <AdminPagination page={1} pageSize={10} total={30} onPageChange={() => {}} />,
    );
    const prev = screen.getByText(/Önceki/) as HTMLButtonElement;
    expect(prev).toBeDisabled();
  });
});
