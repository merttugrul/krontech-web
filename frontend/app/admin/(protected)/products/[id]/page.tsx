import type { Metadata } from 'next';
import { ProductEditPage } from '@/components/admin/products/ProductEditPage';

export const metadata: Metadata = { title: 'Ürün Düzenle' };

export default function AdminProductEditPage({ params }: { params: { id: string } }) {
  return <ProductEditPage id={params.id} />;
}
