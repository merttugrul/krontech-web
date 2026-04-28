import {
  ProductListingPage,
  productListingMetadata,
} from '@/components/sections/product/ProductListingPage';

const LOCALE = 'en' as const;

export const dynamic = 'force-dynamic';
export const metadata = productListingMetadata(LOCALE, 'products');

export default function Page() {
  return <ProductListingPage locale={LOCALE} kind="products" />;
}
