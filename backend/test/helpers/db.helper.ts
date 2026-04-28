import * as bcrypt from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';

/**
 * Test DB'yi TRUNCATE ile hızlı temizler. beforeEach içinde çağrılır.
 *
 * CASCADE sayesinde translations, versions, logs da silinir.
 * RESTART IDENTITY → auto-increment counter'lar sıfırlanır (sayısal kolon yok ama safety).
 */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      content_versions,
      audit_logs,
      product_translations,
      product_category_translations,
      products,
      product_categories,
      blog_post_translations,
      blog_posts,
      resources,
      testimonials,
      offices,
      announcement_bars,
      form_submissions,
      media,
      redirects,
      users
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Test ortamında Redis cache'i temizler.
 *
 * Neden gerekli? resetDatabase() DB'yi temizler ama önceki test'in cache'lediği
 * sonuçlar Redis'te kalabilir (ör. announcement-bar 60sn TTL). Testler
 * millisaniyeler içinde ardı ardına koştuğu için eski cached value sonraki
 * testte "phantom" kayıt olarak dönüyor. `.env.test` Redis index=1 kullanır,
 * FLUSHDB bu yüzden güvenli (dev DB index=0'ı etkilemez).
 */
export async function resetCache(app: INestApplication): Promise<void> {
  const redis = app.get(RedisService);
  await redis.getClient().flushdb();
}

/**
 * DB + cache birlikte. Her beforeEach'te tek satır çağrı yeter.
 */
export async function resetAll(prisma: PrismaService, app: INestApplication): Promise<void> {
  await Promise.all([resetDatabase(prisma), resetCache(app)]);
}

export interface SeedUsers {
  admin: { id: string; email: string; password: string };
  editor: { id: string; email: string; password: string };
}

/**
 * Minimum fixture: 1 admin + 1 editor kullanıcı.
 * Her testin login yapabilmesi için yeterli.
 */
export async function seedUsers(prisma: PrismaService): Promise<SeedUsers> {
  const adminPassword = 'Admin123!';
  const editorPassword = 'Editor123!';

  const [admin, editor] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@test.local',
        passwordHash: await bcrypt.hash(adminPassword, 4), // test: düşük salt
        role: 'admin',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'editor@test.local',
        passwordHash: await bcrypt.hash(editorPassword, 4),
        role: 'editor',
        isActive: true,
      },
    }),
  ]);

  return {
    admin: { id: admin.id, email: admin.email, password: adminPassword },
    editor: { id: editor.id, email: editor.email, password: editorPassword },
  };
}

/**
 * Test fixture: blog post (veya news).
 * Blog e2e testleri için.
 */
export async function seedBlogPost(
  prisma: PrismaService,
  opts: {
    status?: 'draft' | 'published' | 'scheduled';
    type?: 'blog' | 'news';
    isHighlight?: boolean;
    authorId?: string;
    slug?: string;
  } = {},
): Promise<{ id: string; slug: string }> {
  const status = opts.status ?? 'published';
  const post = await prisma.blogPost.create({
    data: {
      slug: opts.slug ?? 'test-blog-post',
      type: opts.type ?? 'blog',
      status,
      publishedAt: status === 'published' ? new Date() : null,
      isHighlight: opts.isHighlight ?? false,
      authorId: opts.authorId,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Test Blog Post',
            excerpt: 'A long enough excerpt for validation rules.',
            content: '<p>English body</p>',
          },
          {
            locale: 'tr',
            title: 'Test Blog Yazısı',
            excerpt: 'Validasyon için yeterince uzun özet.',
            content: '<p>Türkçe gövde</p>',
          },
        ],
      },
    },
  });
  return { id: post.id, slug: post.slug };
}

/**
 * Sadece EN çevirili yayın postu (TR locale’de EN fallback’ini test etmek için).
 */
export async function seedBlogPostEnOnly(
  prisma: PrismaService,
  opts: { authorId: string; slug?: string; title?: string },
): Promise<{ id: string; slug: string }> {
  const slug = opts.slug ?? 'en-only-blog';
  const title = opts.title ?? 'EN Only Post';
  const post = await prisma.blogPost.create({
    data: {
      slug,
      type: 'blog',
      status: 'published',
      publishedAt: new Date(),
      isHighlight: false,
      authorId: opts.authorId,
      translations: {
        create: [
          {
            locale: 'en',
            title,
            excerpt: 'A long enough excerpt for validation rules.',
            content: '<p>English body</p>',
          },
        ],
      },
    },
  });
  return { id: post.id, slug: post.slug };
}

/**
 * Test fixture: kategori + ürün örneği.
 * Products e2e testleri için.
 */
export async function seedBasicProduct(
  prisma: PrismaService,
  opts: { status?: 'draft' | 'published' | 'scheduled' } = {},
): Promise<{ productId: string; categoryId: string; slug: string }> {
  const category = await prisma.productCategory.create({
    data: {
      slug: 'test-category',
      order: 0,
      translations: {
        create: [
          { locale: 'en', name: 'Test Category' },
          { locale: 'tr', name: 'Test Kategori' },
        ],
      },
    },
  });

  const status = opts.status ?? 'published';
  const product = await prisma.product.create({
    data: {
      slug: 'test-product',
      categoryId: category.id,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      order: 0,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Test Product',
            shortDescription: 'A long enough description for validation.',
          },
          {
            locale: 'tr',
            title: 'Test Ürünü',
            shortDescription: 'Validasyon için yeterince uzun bir açıklama.',
          },
        ],
      },
    },
  });

  return { productId: product.id, categoryId: category.id, slug: product.slug };
}
