import type { Locale, PostType } from '@/lib/types';
import type { AdminRole } from './auth-types';

export type ContentStatus = 'draft' | 'published' | 'scheduled';

export interface AdminPaginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Products ────────────────────────────────────────────────────────

export interface AdminProductTranslation {
  id?: string;
  locale: Locale;
  title: string;
  shortDescription: string;
  solution?: unknown;
  howItWorks?: unknown;
  keyBenefits?: unknown;
  productFamily?: unknown;
  videos?: unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
  structuredData?: unknown;
}

export type ProductKind = 'product' | 'solution';

export interface AdminProduct {
  id: string;
  slug: string;
  kind: ProductKind;
  status: ContentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  order: number;
  categoryId: string | null;
  category: { id: string; slug: string } | null;
  translations: AdminProductTranslation[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductListItem {
  id: string;
  slug: string;
  kind: ProductKind;
  status: ContentStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  order: number;
  category: { id: string; slug: string } | null;
  // admin list response bazen sadece EN translation'ı döner
  title: string;
  updatedAt: string;
}

export interface AdminProductCategory {
  id: string;
  slug: string;
  translations: Array<{ locale: Locale; name: string; description?: string | null }>;
}

// ─── Blog ────────────────────────────────────────────────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AdminBlogTranslation {
  id?: string;
  locale: Locale;
  title: string;
  excerpt: string;
  content: string;
  faqItems?: FaqItem[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
}

export interface AdminBlogPost {
  id: string;
  slug: string;
  type: PostType;
  status: ContentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  coverImage: string | null;
  isHighlight: boolean;
  viewCount: number;
  author: { id: string; email: string } | null;
  authorId: string | null;
  translations: AdminBlogTranslation[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogListItem {
  id: string;
  slug: string;
  type: PostType;
  status: ContentStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  isHighlight: boolean;
  viewCount: number;
  coverImage: string | null;
  title: string;
  updatedAt: string;
}

// ─── Media ───────────────────────────────────────────────────────────

export interface AdminMedia {
  id: string;
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
}

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export type AllowedMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/svg+xml'
  | 'image/gif'
  | 'application/pdf';

// ─── Resources ─────────────────────────────────────────────────────

export type ResourceType = 'datasheet' | 'casestudy' | 'whitepaper';

export interface AdminResource {
  id: string;
  type: ResourceType;
  productId: string | null;
  coverImage: string | null;
  fileUrl: string;
  locale: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Form submissions ────────────────────────────────────────────────

export type FormType = 'contact' | 'demo';

export interface AdminFormSubmission {
  id: string;
  formType: FormType;
  data: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  locale: string | null;
  source: string | null;
  createdAt: string;
}

// ─── Redirects ───────────────────────────────────────────────────────

export interface AdminRedirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Announcement bar ────────────────────────────────────────────────

export interface AdminAnnouncementBar {
  id: string;
  locale: string;
  text: string;
  linkUrl: string | null;
  linkLabel: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Offices ─────────────────────────────────────────────────────────

export interface AdminOffice {
  id: string;
  city: string;
  email: string;
  phone: string;
  fax: string | null;
  address: string;
  image: string | null;
  imagePosition: string;
  order: number;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Users (admin-only API) ──────────────────────────────────────────

export interface AdminUserAccount {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
