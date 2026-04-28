'use client';

import { useQuery } from '@tanstack/react-query';
import { getProduct } from '@/lib/admin/api-products';
import { ProductForm } from './ProductForm';
import { getApiErrorMessage } from '@/lib/api';

export function ProductEditPage({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: () => getProduct(id),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-kron-gray">
        Yükleniyor…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(error, 'Ürün bulunamadı.')}
      </div>
    );
  }

  return <ProductForm mode="edit" initial={data} />;
}
