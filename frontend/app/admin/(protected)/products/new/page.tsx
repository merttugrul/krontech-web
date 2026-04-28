import type { Metadata } from 'next';
import { ProductCreatePage } from '@/components/admin/products/ProductCreatePage';

export const metadata: Metadata = { title: 'Yeni Ürün' };

export default function AdminProductNewPage() {
  return <ProductCreatePage />;
}
