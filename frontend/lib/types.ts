/**
 * Backend API'nin publicly-exposed response tipleri.
 * Bu dosya backend'deki NestJS service'lerin public return tipleriyle eşleşir.
 * Backend değişirse burası da güncellenmeli — iki uç arasındaki sözleşme.
 */

export type Locale = 'en' | 'tr';

// ─────────────────────────────────────
// Shared
// ─────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─────────────────────────────────────
// Products
// ─────────────────────────────────────

export interface ProductListItem {
  id: string;
  slug: string;
  order: number;
  publishedAt: string | null;
  category: { slug: string; name: string } | null;
  title: string;
  shortDescription: string;
  ogImage: string | null;
}

export interface ProductDetail extends ProductListItem {
  solution: unknown;
  howItWorks: unknown;
  keyBenefits: unknown;
  productFamily: unknown;
  videos: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  structuredData: unknown;
}

// ─────────────────────────────────────
// Blog
// ─────────────────────────────────────

export type PostType = 'blog' | 'news';

export interface BlogListItem {
  id: string;
  slug: string;
  type: PostType;
  coverImage: string | null;
  publishedAt: string | null;
  isHighlight: boolean;
  viewCount: number;
  author: { id: string; email: string } | null;
  title: string;
  excerpt: string;
  ogImage: string | null;
}

export interface BlogDetail extends BlogListItem {
  content: string;
  faqItems: Array<{ question: string; answer: string }> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
}

// ─────────────────────────────────────
// Resources
// ─────────────────────────────────────

export type ResourceType = 'datasheet' | 'casestudy' | 'whitepaper';

export interface Resource {
  id: string;
  type: ResourceType;
  productId: string | null;
  coverImage: string | null;
  fileUrl: string | null;
  locale: Locale;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────
// AnnouncementBar / Offices
// ─────────────────────────────────────

export interface AnnouncementBar {
  id: string;
  locale: Locale;
  text: string;
  linkUrl: string | null;
  linkLabel: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface Office {
  id: string;
  city: string;
  email: string;
  phone: string;
  fax: string | null;
  address: string;
  image: string | null;
  imagePosition: 'left' | 'right';
  order: number;
  locale: Locale;
}

// ─────────────────────────────────────
// Forms
// ─────────────────────────────────────

export interface ContactFormData {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  recaptchaToken: string;
  // Honeypot (gizli, spam botları dolduracak):
  website?: string;
}

export interface DemoFormData extends ContactFormData {
  product?: string;
}

// ─────────────────────────────────────
// Redirects
// ─────────────────────────────────────

export interface RedirectLookupResult {
  redirect: { toPath: string; statusCode: 301 | 302 } | null;
}
