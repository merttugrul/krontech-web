import type { Metadata } from 'next';
import { ProductsList } from '@/components/admin/products/ProductsList';

export const metadata: Metadata = { title: 'Ürünler' };

export default function AdminProductsPage() {
  return <ProductsList />;
}
