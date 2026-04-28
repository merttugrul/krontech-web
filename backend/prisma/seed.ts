/**
 * Krontech seed dosyası
 *
 * - Idempotent: upsert kullanır, tekrar tekrar çalıştırılabilir.
 * - Veriler temsili. Production'da admin paneli üzerinden yönetilir.
 *
 * Çalıştırma:
 *   npm run prisma:seed
 *   veya
 *   npx prisma db seed
 */

import {
  PrismaClient,
  Role,
  ContentStatus,
  PostType,
  ProductKind,
  ResourceType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedSummary {
  users: number;
  categories: number;
  products: number;
  blogPosts: number;
  offices: number;
  announcements: number;
  resources: number;
  testimonials: number;
}

async function seedAdmin(): Promise<{ id: string; email: string }> {
  const email = process.env.ADMIN_EMAIL ?? 'admin@krontech.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.admin, isActive: true },
    create: { email, passwordHash, role: Role.admin, isActive: true },
  });

  return { id: admin.id, email: admin.email };
}

async function seedProductCategories(): Promise<Map<string, string>> {
  const categories = [
    {
      slug: 'identity-access-management',
      translations: [
        { locale: 'en', name: 'Identity & Access Management' },
        { locale: 'tr', name: 'Kimlik ve Erişim Yönetimi' },
      ],
      order: 1,
    },
    {
      slug: 'data-security',
      translations: [
        { locale: 'en', name: 'Data Security & Data Management' },
        { locale: 'tr', name: 'Veri Güvenliği ve Yönetimi' },
      ],
      order: 2,
    },
    {
      slug: 'telco-solutions',
      translations: [
        { locale: 'en', name: 'Telco Solutions' },
        { locale: 'tr', name: 'Telekom Çözümleri' },
      ],
      order: 3,
    },
  ];

  const slugToId = new Map<string, string>();

  for (const cat of categories) {
    const created = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: { order: cat.order },
      create: { slug: cat.slug, order: cat.order },
    });

    for (const tr of cat.translations) {
      await prisma.productCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: created.id, locale: tr.locale } },
        update: { name: tr.name },
        create: { categoryId: created.id, locale: tr.locale, name: tr.name },
      });
    }

    slugToId.set(cat.slug, created.id);
  }

  return slugToId;
}

async function seedProducts(categoryIds: Map<string, string>): Promise<{ kronPamId: string }> {
  const iamId = categoryIds.get('identity-access-management');
  if (!iamId) throw new Error('IAM category not found');

  const product = await prisma.product.upsert({
    where: { slug: 'kron-pam' },
    update: {
      kind: ProductKind.product,
      categoryId: iamId,
      status: ContentStatus.published,
      publishedAt: new Date(),
      order: 1,
    },
    create: {
      slug: 'kron-pam',
      kind: ProductKind.product,
      categoryId: iamId,
      status: ContentStatus.published,
      publishedAt: new Date(),
      order: 1,
    },
  });

  // EN translation
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product.id, locale: 'en' } },
    update: {},
    create: {
      productId: product.id,
      locale: 'en',
      title: 'Kron PAM',
      shortDescription:
        'Privileged Access Management — Secure, monitor and audit privileged accounts across your enterprise.',
      solution: [
        {
          title: 'Centralized Privileged Access Control',
          highlightedWord: 'Privileged Access',
          description:
            'Manage all privileged accounts from a single pane of glass with policy-driven workflows.',
          image: '/images/kron-pam/solution-1.png',
          imagePosition: 'right',
        },
        {
          title: 'Session Recording & Audit',
          highlightedWord: 'Session Recording',
          description:
            'Record every privileged session and provide tamper-proof audit trails for compliance.',
          image: '/images/kron-pam/solution-2.png',
          imagePosition: 'left',
        },
      ],
      keyBenefits: [
        {
          title: 'Compliance Ready',
          description: 'PCI-DSS, ISO 27001, SOX, GDPR & KVKK aligned controls out of the box.',
          icon: 'shield-check',
        },
        {
          title: 'Zero Trust',
          description: 'Just-in-time, least-privilege access with multi-factor authentication.',
          icon: 'lock',
        },
        {
          title: 'Reduce Insider Threats',
          description: 'Real-time anomaly detection and automated response to suspicious behavior.',
          icon: 'eye',
        },
      ],
      videos: [
        { title: 'Kron PAM Overview', youtubeUrl: 'https://www.youtube.com/watch?v=example1' },
      ],
      metaTitle: 'Kron PAM — Privileged Access Management Solution | Krontech',
      metaDescription:
        'Kron PAM provides enterprise-grade privileged access management with session recording, audit trails, and zero-trust security. Trusted by 200+ partners worldwide.',
      ogImage: '/images/kron-pam/og.jpg',
      noIndex: false,
    },
  });

  // TR translation
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product.id, locale: 'tr' } },
    update: {},
    create: {
      productId: product.id,
      locale: 'tr',
      title: 'Kron PAM',
      shortDescription:
        'Ayrıcalıklı Erişim Yönetimi — Kurumsal ayrıcalıklı hesaplarınızı güvence altına alın, izleyin ve denetleyin.',
      solution: [
        {
          title: 'Merkezi Ayrıcalıklı Erişim Kontrolü',
          highlightedWord: 'Ayrıcalıklı Erişim',
          description:
            'Tüm ayrıcalıklı hesapları tek panelden, politika tabanlı iş akışlarıyla yönetin.',
          image: '/images/kron-pam/solution-1.png',
          imagePosition: 'right',
        },
      ],
      keyBenefits: [
        {
          title: 'Uyumluluk Hazır',
          description: 'PCI-DSS, ISO 27001, KVKK uyumlu kontroller hazır gelir.',
          icon: 'shield-check',
        },
      ],
      metaTitle: 'Kron PAM — Ayrıcalıklı Erişim Yönetimi | Krontech',
      metaDescription:
        'Kron PAM, oturum kaydı, denetim izleri ve sıfır güven güvenlik ile kurumsal düzeyde ayrıcalıklı erişim yönetimi sağlar.',
      ogImage: '/images/kron-pam/og.jpg',
      noIndex: false,
    },
  });

  return { kronPamId: product.id };
}

async function seedTestimonials(productId: string): Promise<number> {
  const testimonials = [
    {
      productId,
      companyName: 'Türk Telekom',
      companyLogo: '/images/testimonials/turk-telekom.svg',
      quote:
        'Kron PAM has been a cornerstone of our compliance and security strategy for over 5 years.',
      personName: 'Ahmet Yılmaz',
      personTitle: 'Chief Information Security Officer',
      locale: 'en',
      order: 1,
    },
    {
      productId,
      companyName: 'Garanti BBVA',
      companyLogo: '/images/testimonials/garanti.svg',
      quote: 'Seamless integration with our existing infrastructure and excellent support.',
      personName: 'Ayşe Demir',
      personTitle: 'Head of Cybersecurity',
      locale: 'en',
      order: 2,
    },
  ];

  let count = 0;
  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { productId: t.productId, companyName: t.companyName, locale: t.locale },
    });
    if (existing) {
      await prisma.testimonial.update({ where: { id: existing.id }, data: t });
    } else {
      await prisma.testimonial.create({ data: t });
    }
    count++;
  }
  return count;
}

async function seedResources(productId: string): Promise<number> {
  const resources = [
    {
      type: ResourceType.datasheet,
      productId,
      title: 'Kron PAM Datasheet',
      description: 'Comprehensive technical overview of Kron PAM features and architecture.',
      coverImage: '/images/resources/kron-pam-datasheet-cover.png',
      fileUrl: 'https://example.com/datasheets/kron-pam.pdf',
      locale: 'en',
      status: ContentStatus.published,
      order: 1,
    },
    {
      type: ResourceType.casestudy,
      productId,
      title: 'How a Top-5 Bank Achieved PCI-DSS Compliance with Kron PAM',
      description: 'Customer success story on enterprise-scale PAM deployment.',
      coverImage: '/images/resources/case-study-bank.png',
      fileUrl: 'https://example.com/case-studies/bank.pdf',
      locale: 'en',
      status: ContentStatus.published,
      order: 1,
    },
  ];

  let count = 0;
  for (const r of resources) {
    const existing = await prisma.resource.findFirst({
      where: { title: r.title, locale: r.locale },
    });
    if (existing) {
      await prisma.resource.update({ where: { id: existing.id }, data: r });
    } else {
      await prisma.resource.create({ data: r });
    }
    count++;
  }
  return count;
}

async function seedBlogPosts(authorId: string): Promise<number> {
  const posts = [
    {
      slug: 'what-is-privileged-access-management',
      type: PostType.blog,
      coverImage: '/images/blog/what-is-pam.jpg',
      isHighlight: true,
      en: {
        title: 'What is Privileged Access Management (PAM)?',
        excerpt:
          'A complete guide to PAM: definitions, benefits, and how to implement it in your organization.',
        content: `<h2>Introduction to PAM</h2><p>Privileged Access Management (PAM) refers to a class of solutions that secure, control, manage, and monitor privileged access to critical assets.</p><h2>Why PAM matters</h2><p>Privileged accounts are prime targets for attackers. PAM mitigates this risk through least privilege, session recording, and just-in-time access.</p>`,
        faqItems: [
          {
            question: 'What is the difference between PAM and IAM?',
            answer:
              'IAM manages identities and standard access; PAM specifically focuses on privileged accounts and their elevated permissions.',
          },
          {
            question: 'Is PAM required for compliance?',
            answer:
              'Yes — most major frameworks (PCI-DSS, ISO 27001, SOX, KVKK, GDPR) explicitly require controls over privileged access.',
          },
        ],
        metaTitle: 'What is Privileged Access Management? | Krontech Blog',
        metaDescription:
          'Learn what PAM is, why it matters, and how to deploy it. Complete guide with FAQs from Krontech experts.',
      },
      tr: {
        title: 'Ayrıcalıklı Erişim Yönetimi (PAM) Nedir?',
        excerpt: 'PAM rehberi: tanımlar, faydalar ve kurumunuzda nasıl uygulanır.',
        content: `<h2>PAM'a Giriş</h2><p>Ayrıcalıklı Erişim Yönetimi (PAM), kritik varlıklara ayrıcalıklı erişimi güvence altına alan, kontrol eden ve izleyen çözüm sınıfıdır.</p>`,
        faqItems: [
          {
            question: 'PAM ile IAM arasındaki fark nedir?',
            answer:
              'IAM kimlikleri ve standart erişimi yönetir; PAM özellikle ayrıcalıklı hesaplara odaklanır.',
          },
        ],
        metaTitle: 'Ayrıcalıklı Erişim Yönetimi (PAM) Nedir? | Krontech Blog',
        metaDescription: 'PAM nedir, neden önemlidir ve nasıl uygulanır.',
      },
    },
    {
      slug: 'top-cybersecurity-trends-2026',
      type: PostType.news,
      coverImage: '/images/blog/trends-2026.jpg',
      isHighlight: true,
      en: {
        title: 'Top Cybersecurity Trends to Watch in 2026',
        excerpt: 'AI-driven attacks, zero-trust adoption, and the rise of identity-first security.',
        content: `<h2>Trend 1: AI-driven attacks</h2><p>Generative AI lowers the barrier for sophisticated phishing and social engineering.</p><h2>Trend 2: Zero Trust everywhere</h2><p>Organizations are extending zero-trust principles beyond the network perimeter.</p>`,
        faqItems: null,
        metaTitle: 'Top Cybersecurity Trends 2026 | Krontech',
        metaDescription: 'Discover the cybersecurity trends that will shape 2026.',
      },
      tr: {
        title: '2026 Yılında Takip Edilmesi Gereken Siber Güvenlik Trendleri',
        excerpt: 'AI destekli saldırılar, sıfır güven mimarisi ve kimlik öncelikli güvenlik.',
        content: `<h2>Trend 1: AI destekli saldırılar</h2><p>Üretken AI, sofistike oltalama ve sosyal mühendislik için engeli düşürür.</p>`,
        faqItems: null,
        metaTitle: '2026 Siber Güvenlik Trendleri | Krontech',
        metaDescription: '2026 yılında siber güvenlik dünyasını şekillendirecek trendler.',
      },
    },
    {
      slug: 'session-recording-best-practices',
      type: PostType.blog,
      coverImage: '/images/blog/session-recording.jpg',
      isHighlight: false,
      en: {
        title: 'Session Recording Best Practices for Privileged Accounts',
        excerpt: 'How to implement session recording without sacrificing performance or privacy.',
        content: `<h2>Why record sessions?</h2><p>Recording every privileged session creates an immutable audit trail and a strong deterrent.</p>`,
        faqItems: null,
        metaTitle: 'Session Recording Best Practices | Krontech Blog',
        metaDescription: 'Best practices for implementing session recording.',
      },
      tr: {
        title: 'Ayrıcalıklı Hesaplar için Oturum Kaydı En İyi Uygulamaları',
        excerpt: 'Performans ve gizlilikten ödün vermeden oturum kaydı nasıl uygulanır.',
        content: `<h2>Neden oturum kaydı?</h2><p>Her ayrıcalıklı oturumun kaydedilmesi değişmez bir denetim izi oluşturur.</p>`,
        faqItems: null,
        metaTitle: 'Oturum Kaydı En İyi Uygulamaları | Krontech',
        metaDescription: 'Oturum kaydı uygulamak için en iyi yaklaşımlar.',
      },
    },
  ];

  let count = 0;
  for (const post of posts) {
    const created = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        type: post.type,
        coverImage: post.coverImage,
        isHighlight: post.isHighlight,
        status: ContentStatus.published,
        publishedAt: new Date(),
        authorId,
      },
      create: {
        slug: post.slug,
        type: post.type,
        coverImage: post.coverImage,
        isHighlight: post.isHighlight,
        status: ContentStatus.published,
        publishedAt: new Date(),
        authorId,
      },
    });

    for (const locale of ['en', 'tr'] as const) {
      const tr = post[locale];
      await prisma.blogPostTranslation.upsert({
        where: { blogPostId_locale: { blogPostId: created.id, locale } },
        update: {
          title: tr.title,
          excerpt: tr.excerpt,
          content: tr.content,
          faqItems: tr.faqItems ?? undefined,
          metaTitle: tr.metaTitle,
          metaDescription: tr.metaDescription,
        },
        create: {
          blogPostId: created.id,
          locale,
          title: tr.title,
          excerpt: tr.excerpt,
          content: tr.content,
          faqItems: tr.faqItems ?? undefined,
          metaTitle: tr.metaTitle,
          metaDescription: tr.metaDescription,
        },
      });
    }
    count++;
  }
  return count;
}

async function seedOffices(): Promise<number> {
  const offices = [
    {
      city: 'Istanbul HQ',
      email: 'info@krontech.com',
      phone: '+90 (212) 999 9999',
      fax: '+90 (212) 999 9998',
      address: 'Maslak Mahallesi, Büyükdere Cad. No:123, 34485 Sarıyer / İstanbul, Türkiye',
      image: '/images/offices/istanbul.jpg',
      imagePosition: 'right',
      order: 1,
      locale: 'en',
    },
    {
      city: 'USA',
      email: 'usa@krontech.com',
      phone: '+1 (646) 555 0100',
      address: '500 7th Avenue, 8th Floor, New York, NY 10018, USA',
      image: '/images/offices/usa.jpg',
      imagePosition: 'left',
      order: 2,
      locale: 'en',
    },
    {
      city: 'Ankara',
      email: 'ankara@krontech.com',
      phone: '+90 (312) 999 9999',
      address: 'Çankaya, Ankara, Türkiye',
      image: '/images/offices/ankara.jpg',
      imagePosition: 'right',
      order: 3,
      locale: 'en',
    },
    {
      city: 'Izmir',
      email: 'izmir@krontech.com',
      phone: '+90 (232) 999 9999',
      address: 'Konak, İzmir, Türkiye',
      image: '/images/offices/izmir.jpg',
      imagePosition: 'left',
      order: 4,
      locale: 'en',
    },
    // TR locale
    {
      city: 'İstanbul Genel Merkez',
      email: 'info@krontech.com',
      phone: '+90 (212) 999 9999',
      fax: '+90 (212) 999 9998',
      address: 'Maslak Mahallesi, Büyükdere Cad. No:123, 34485 Sarıyer / İstanbul',
      image: '/images/offices/istanbul.jpg',
      imagePosition: 'right',
      order: 1,
      locale: 'tr',
    },
    {
      city: 'Ankara',
      email: 'ankara@krontech.com',
      phone: '+90 (312) 999 9999',
      address: 'Çankaya, Ankara',
      image: '/images/offices/ankara.jpg',
      imagePosition: 'right',
      order: 3,
      locale: 'tr',
    },
  ];

  let count = 0;
  for (const o of offices) {
    const existing = await prisma.office.findFirst({
      where: { city: o.city, locale: o.locale },
    });
    if (existing) {
      await prisma.office.update({ where: { id: existing.id }, data: o });
    } else {
      await prisma.office.create({ data: o });
    }
    count++;
  }
  return count;
}

async function seedAnnouncementBars(): Promise<number> {
  const bars = [
    {
      locale: 'en',
      text: 'Join us at Cybersecurity Summit 2026 — Register now for free!',
      linkUrl: '/events/cybersecurity-summit-2026',
      linkLabel: 'Register Now',
      isActive: true,
    },
    {
      locale: 'tr',
      text: '2026 Siber Güvenlik Zirvesi\'nde bize katılın — Ücretsiz kayıt olun!',
      linkUrl: '/tr/etkinlikler/siber-guvenlik-zirvesi-2026',
      linkLabel: 'Şimdi Kaydol',
      isActive: true,
    },
  ];

  let count = 0;
  for (const bar of bars) {
    const existing = await prisma.announcementBar.findFirst({
      where: { locale: bar.locale, text: bar.text },
    });
    if (existing) {
      await prisma.announcementBar.update({ where: { id: existing.id }, data: bar });
    } else {
      await prisma.announcementBar.create({ data: bar });
    }
    count++;
  }
  return count;
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Krontech database seed başlatılıyor...\n');

  const admin = await seedAdmin();
  // eslint-disable-next-line no-console
  console.log(`Admin user hazır: ${admin.email}`);

  const categoryIds = await seedProductCategories();
  // eslint-disable-next-line no-console
  console.log(`${categoryIds.size} ürün kategorisi`);

  const { kronPamId } = await seedProducts(categoryIds);
  // eslint-disable-next-line no-console
  console.log('1 ürün (kron-pam) + EN/TR çevirileri');

  const testimonialCount = await seedTestimonials(kronPamId);
  // eslint-disable-next-line no-console
  console.log(`${testimonialCount} testimonial`);

  const resourceCount = await seedResources(kronPamId);
  // eslint-disable-next-line no-console
  console.log(`${resourceCount} resource (datasheet/case study)`);

  const blogCount = await seedBlogPosts(admin.id);
  // eslint-disable-next-line no-console
  console.log(`${blogCount} blog post + EN/TR çevirileri`);

  const officeCount = await seedOffices();
  // eslint-disable-next-line no-console
  console.log(`${officeCount} ofis kaydı`);

  const announcementCount = await seedAnnouncementBars();
  // eslint-disable-next-line no-console
  console.log(`${announcementCount} announcement bar`);

  const summary: SeedSummary = {
    users: 1,
    categories: categoryIds.size,
    products: 1,
    blogPosts: blogCount,
    offices: officeCount,
    announcements: announcementCount,
    resources: resourceCount,
    testimonials: testimonialCount,
  };

  // eslint-disable-next-line no-console
  console.log('\nSeed tamamlandı:', JSON.stringify(summary, null, 2));
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed hatası:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
