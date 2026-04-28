import type { Locale } from './types';

/**
 * Basit sözlük. `next-intl` / `react-i18next` kurmuyoruz çünkü:
 *  - Sayfalarımız directory-based split (`/` EN, `/tr/...` TR).
 *  - RSC içinde çalışırken ekstra provider yükü gereksiz.
 *
 * Daha karmaşık çoğul/değişken formatlar gerekirse ICU MessageFormat'a geçilir.
 */

export interface Dictionary {
  /** Navbar / Footer genel */
  nav: {
    products: string;
    solutions: string;
    resources: string;
    blog: string;
    company: string;
    contact: string;
    demo: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    companyHeading: string;
    productsHeading: string;
    resourcesHeading: string;
    legalHeading: string;
    officesHeading: string;
    aboutUs: string;
    careers: string;
    contact: string;
    privacy: string;
    terms: string;
    cookies: string;
    /** `{year}` token'i runtime'da replace edilir. */
    copyright: string;
    tagline: string;
  };
  announcement: {
    dismiss: string;
  };
  common: {
    switchToTurkish: string;
    switchToEnglish: string;
    loading: string;
    email: string;
    phone: string;
    fax: string;
    address: string;
    readMore: string;
    learnMore: string;
    viewAll: string;
    getStarted: string;
  };
  home: {
    heroEyebrow: string;
    heroTitlePrefix: string;
    heroTitleHighlight: string;
    heroTitleSuffix: string;
    heroSubtitle: string;
    heroPrimaryCta: string;
    heroSecondaryCta: string;

    productsHeading: string;
    productsSubheading: string;
    productsEmpty: string;
    productsCtaAll: string;

    valuePropsHeading: string;
    valuePropsSubheading: string;
    valueProps: Array<{ title: string; description: string; icon: 'shield' | 'bolt' | 'graph' | 'globe' }>;

    latestBlogHeading: string;
    latestBlogSubheading: string;
    latestBlogEmpty: string;
    latestBlogCtaAll: string;

    ctaHeading: string;
    ctaSubheading: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  products: {
    breadcrumbHome: string;
    breadcrumbProducts: string;
    heroCta: string;
    heroSecondaryCta: string;
    solutionDefaultHeading: string;
    howItWorksDefaultHeading: string;
    keyBenefitsDefaultHeading: string;
    productFamilyDefaultHeading: string;
    videosDefaultHeading: string;
    relatedHeading: string;
    notFoundTitle: string;
    notFoundDescription: string;
    notFoundCta: string;
  };
  contact: {
    heroEyebrow: string;
    contactTitle: string;
    contactSubtitle: string;
    demoTitle: string;
    demoSubtitle: string;
    breadcrumbHome: string;
    breadcrumbContact: string;
    breadcrumbDemo: string;
    fieldName: string;
    fieldEmail: string;
    fieldCompany: string;
    fieldPhone: string;
    fieldJobTitle: string;
    fieldProductInterest: string;
    fieldMessage: string;
    placeholderName: string;
    placeholderEmail: string;
    placeholderCompany: string;
    placeholderPhone: string;
    placeholderJobTitle: string;
    placeholderProductInterest: string;
    placeholderMessage: string;
    optionalLabel: string;
    submitContact: string;
    submitDemo: string;
    submitLoading: string;
    successTitle: string;
    successContactDescription: string;
    successDemoDescription: string;
    successNewSubmission: string;
    errorTitle: string;
    errorGeneric: string;
    errorRateLimited: string;
    errorRecaptcha: string;
    privacyNotice: string;
    officesHeading: string;
    officesEmpty: string;
    validation: {
      nameMin: string;
      nameMax: string;
      emailInvalid: string;
      companyRequired: string;
      companyMax: string;
      messageMin: string;
      messageMax: string;
      phoneInvalid: string;
    };
  };
  resources: {
    title: string;
    subtitle: string;
    breadcrumbHome: string;
    breadcrumbResources: string;
    filterAll: string;
    filterDatasheet: string;
    filterCasestudy: string;
    filterWhitepaper: string;
    typeDatasheet: string;
    typeCasestudy: string;
    typeWhitepaper: string;
    emptyTitle: string;
    emptyDescription: string;
    downloadCta: string;
    viewDetailCta: string;
    noFile: string;
    relatedHeading: string;
    notFoundTitle: string;
    notFoundDescription: string;
    notFoundCta: string;
    paginationPrev: string;
    paginationNext: string;
    paginationPage: string;
  };
  blog: {
    blogTitle: string;
    blogSubtitle: string;
    newsTitle: string;
    newsSubtitle: string;
    breadcrumbHome: string;
    breadcrumbBlog: string;
    breadcrumbNews: string;
    filterAll: string;
    filterHighlight: string;
    emptyListTitle: string;
    emptyListDescription: string;
    typeBlog: string;
    typeNews: string;
    publishedOn: string;
    minRead: string;
    authorBy: string;
    viewsLabel: string;
    tocHeading: string;
    faqHeading: string;
    relatedHeading: string;
    notFoundTitle: string;
    notFoundDescription: string;
    notFoundCta: string;
    paginationPrev: string;
    paginationNext: string;
    paginationPage: string;
  };
}

const en: Dictionary = {
  nav: {
    products: 'Products',
    solutions: 'Solutions',
    resources: 'Resources',
    blog: 'Blog',
    company: 'Company',
    contact: 'Contact',
    demo: 'Get a Demo',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  footer: {
    companyHeading: 'Company',
    productsHeading: 'Products',
    resourcesHeading: 'Resources',
    legalHeading: 'Legal',
    officesHeading: 'Offices',
    aboutUs: 'About Us',
    careers: 'Careers',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    cookies: 'Cookie Policy',
    copyright: '© {year} Kron Technologies. All rights reserved.',
    tagline: 'Privileged Access · Telemetry Pipeline · Observability',
  },
  announcement: {
    dismiss: 'Dismiss announcement',
  },
  common: {
    switchToTurkish: 'Türkçe',
    switchToEnglish: 'English',
    loading: 'Loading…',
    email: 'Email',
    phone: 'Phone',
    fax: 'Fax',
    address: 'Address',
    readMore: 'Read more',
    learnMore: 'Learn more',
    viewAll: 'View all',
    getStarted: 'Get started',
  },
  home: {
    heroEyebrow: 'Privileged Access · Telemetry Pipeline · Observability',
    heroTitlePrefix: 'Enterprise-grade',
    heroTitleHighlight: 'Telemetry Pipeline',
    heroTitleSuffix: 'built for privileged access security.',
    heroSubtitle:
      'Kron unifies observability, audit and session control across your hybrid cloud. Capture everything, store nothing you do not need, and respond in seconds — not days.',
    heroPrimaryCta: 'Request a Demo',
    heroSecondaryCta: 'Explore Products',

    productsHeading: 'Products that power your security stack',
    productsSubheading:
      'From session recording to high-cardinality telemetry, Kron is the backbone enterprises trust for privileged access and observability.',
    productsEmpty: 'Product catalog will appear here once published.',
    productsCtaAll: 'View all products',

    valuePropsHeading: 'Why teams choose Kron',
    valuePropsSubheading:
      'Proven in banking, telco and critical infrastructure. Deployed on-prem, cloud or air-gapped.',
    valueProps: [
      {
        icon: 'shield',
        title: 'Zero-trust by default',
        description:
          'Policy-driven privileged access with full session recording, MFA everywhere and tamper-evident audit trails.',
      },
      {
        icon: 'bolt',
        title: 'Sub-second telemetry',
        description:
          'Ingest millions of events per second, parse and route them with declarative pipelines — without sampling trade-offs.',
      },
      {
        icon: 'graph',
        title: 'Operational observability',
        description:
          'Correlate logs, metrics and session events in one plane to cut incident response time by up to 80%.',
      },
      {
        icon: 'globe',
        title: 'Deploy anywhere',
        description:
          'On-prem, private cloud, hyperscaler or air-gapped environments. Supports hybrid topologies out of the box.',
      },
    ],

    latestBlogHeading: 'Latest insights',
    latestBlogSubheading:
      'Engineering deep dives, security research and product announcements from the Kron team.',
    latestBlogEmpty: 'We are preparing fresh content. Check back soon.',
    latestBlogCtaAll: 'Visit the blog',

    ctaHeading: 'See Kron in action on your own data.',
    ctaSubheading:
      'Thirty-minute personalised walkthrough with our solution engineers — no slideware, just your telemetry.',
    ctaPrimary: 'Book a Demo',
    ctaSecondary: 'Talk to Sales',
  },
  products: {
    breadcrumbHome: 'Home',
    breadcrumbProducts: 'Products',
    heroCta: 'Request a Demo',
    heroSecondaryCta: 'Contact Sales',
    solutionDefaultHeading: 'The Solution',
    howItWorksDefaultHeading: 'How it works',
    keyBenefitsDefaultHeading: 'Key benefits',
    productFamilyDefaultHeading: 'Product family',
    videosDefaultHeading: 'Watch',
    relatedHeading: 'Related products',
    notFoundTitle: 'Product not found',
    notFoundDescription:
      'The product you are looking for is not published in this language.',
    notFoundCta: 'Browse all products',
  },
  contact: {
    heroEyebrow: 'Contact',
    contactTitle: 'Talk to our team',
    contactSubtitle:
      'Have a question, feedback, or a partnership request? Send us a message — we usually respond within one business day.',
    demoTitle: 'Request a demo',
    demoSubtitle:
      'See Kron in action. Tell us about your environment and we will tailor a live walkthrough for your team.',
    breadcrumbHome: 'Home',
    breadcrumbContact: 'Contact',
    breadcrumbDemo: 'Request a demo',
    fieldName: 'Full name',
    fieldEmail: 'Work email',
    fieldCompany: 'Company',
    fieldPhone: 'Phone',
    fieldJobTitle: 'Job title',
    fieldProductInterest: 'Product of interest',
    fieldMessage: 'Message',
    placeholderName: 'Jane Doe',
    placeholderEmail: 'jane@company.com',
    placeholderCompany: 'Acme Inc.',
    placeholderPhone: '+1 555 000 0000',
    placeholderJobTitle: 'Security Lead',
    placeholderProductInterest: 'Single Connect, Double Octopus …',
    placeholderMessage: 'How can we help?',
    optionalLabel: 'optional',
    submitContact: 'Send message',
    submitDemo: 'Request demo',
    submitLoading: 'Sending…',
    successTitle: 'Thank you!',
    successContactDescription:
      'Your message has reached us. A specialist will contact you shortly.',
    successDemoDescription:
      'Your demo request was received. We will reach out to schedule a session.',
    successNewSubmission: 'Send another message',
    errorTitle: 'Submission failed',
    errorGeneric:
      'We could not submit your request. Please try again in a moment.',
    errorRateLimited:
      'Too many submissions from your network. Please try again later.',
    errorRecaptcha:
      'Bot verification failed. Please refresh the page and try again.',
    privacyNotice:
      'By submitting this form you agree to our processing of the data you provide.',
    officesHeading: 'Our offices',
    officesEmpty: 'Office list is currently unavailable.',
    validation: {
      nameMin: 'Name must be at least 2 characters.',
      nameMax: 'Name must be under 120 characters.',
      emailInvalid: 'Please enter a valid email address.',
      companyRequired: 'Company is required for demo requests.',
      companyMax: 'Company must be under 160 characters.',
      messageMin: 'Please describe your request (min 10 characters).',
      messageMax: 'Message must be under 5000 characters.',
      phoneInvalid: 'Please enter a valid phone number.',
    },
  },
  resources: {
    title: 'Resources',
    subtitle:
      'Datasheets, case studies and whitepapers — learn how security teams deploy Kron in production.',
    breadcrumbHome: 'Home',
    breadcrumbResources: 'Resources',
    filterAll: 'All',
    filterDatasheet: 'Datasheets',
    filterCasestudy: 'Case studies',
    filterWhitepaper: 'Whitepapers',
    typeDatasheet: 'Datasheet',
    typeCasestudy: 'Case study',
    typeWhitepaper: 'Whitepaper',
    emptyTitle: 'No resources yet.',
    emptyDescription:
      'New materials are being prepared — please check back soon.',
    downloadCta: 'Download PDF',
    viewDetailCta: 'Read more',
    noFile: 'Download unavailable',
    relatedHeading: 'Related resources',
    notFoundTitle: 'Resource not found',
    notFoundDescription:
      'This resource either does not exist or is not available in the selected language.',
    notFoundCta: 'Back to resources',
    paginationPrev: 'Previous',
    paginationNext: 'Next',
    paginationPage: 'Page',
  },
  blog: {
    blogTitle: 'Blog',
    blogSubtitle:
      'Deep dives on privileged access, observability and telemetry engineering — written by the Kron team.',
    newsTitle: 'News',
    newsSubtitle: 'Product launches, customer stories and announcements.',
    breadcrumbHome: 'Home',
    breadcrumbBlog: 'Blog',
    breadcrumbNews: 'News',
    filterAll: 'All posts',
    filterHighlight: 'Highlights',
    emptyListTitle: 'Nothing here yet.',
    emptyListDescription: 'New articles are on the way — check back soon.',
    typeBlog: 'Article',
    typeNews: 'News',
    publishedOn: 'Published',
    minRead: 'min read',
    authorBy: 'By',
    viewsLabel: 'views',
    tocHeading: 'On this page',
    faqHeading: 'Frequently asked questions',
    relatedHeading: 'Related reads',
    notFoundTitle: 'Post not found',
    notFoundDescription:
      'This post either does not exist or is not published in the selected language.',
    notFoundCta: 'Back to blog',
    paginationPrev: 'Previous',
    paginationNext: 'Next',
    paginationPage: 'Page',
  },
};

const tr: Dictionary = {
  nav: {
    products: 'Ürünler',
    solutions: 'Çözümler',
    resources: 'Kaynaklar',
    blog: 'Blog',
    company: 'Kurumsal',
    contact: 'İletişim',
    demo: 'Demo İste',
    openMenu: 'Menüyü aç',
    closeMenu: 'Menüyü kapat',
  },
  footer: {
    companyHeading: 'Kurumsal',
    productsHeading: 'Ürünler',
    resourcesHeading: 'Kaynaklar',
    legalHeading: 'Yasal',
    officesHeading: 'Ofisler',
    aboutUs: 'Hakkımızda',
    careers: 'Kariyer',
    contact: 'İletişim',
    privacy: 'Gizlilik Politikası',
    terms: 'Kullanım Koşulları',
    cookies: 'Çerez Politikası',
    copyright: '© {year} Kron Teknoloji. Tüm hakları saklıdır.',
    tagline: 'Ayrıcalıklı Erişim · Telemetri Pipeline · Gözlemlenebilirlik',
  },
  announcement: {
    dismiss: 'Duyuruyu kapat',
  },
  common: {
    switchToTurkish: 'Türkçe',
    switchToEnglish: 'English',
    loading: 'Yükleniyor…',
    email: 'E-posta',
    phone: 'Telefon',
    fax: 'Faks',
    address: 'Adres',
    readMore: 'Devamını oku',
    learnMore: 'Daha fazla bilgi',
    viewAll: 'Tümünü gör',
    getStarted: 'Başlayın',
  },
  home: {
    heroEyebrow: 'Ayrıcalıklı Erişim · Telemetri Pipeline · Gözlemlenebilirlik',
    heroTitlePrefix: 'Kurumsal ölçekte',
    heroTitleHighlight: 'Telemetri Pipeline',
    heroTitleSuffix: 've ayrıcalıklı erişim güvenliği.',
    heroSubtitle:
      'Kron; hibrit bulut ortamlarında gözlemlenebilirlik, denetim ve oturum kontrolünü tek bir platformda birleştirir. Her şeyi yakalayın, yalnızca ihtiyacınız olanı saklayın ve dakikalar değil saniyeler içinde müdahale edin.',
    heroPrimaryCta: 'Demo Talep Et',
    heroSecondaryCta: 'Ürünleri Keşfet',

    productsHeading: 'Güvenlik yığınınıza güç katan ürünler',
    productsSubheading:
      'Oturum kaydından yüksek kardinaliteli telemetriye kadar; kurumsal firmaların ayrıcalıklı erişim ve gözlemlenebilirlik için güvendiği omurga.',
    productsEmpty: 'Yayınlanan ürünler burada listelenecek.',
    productsCtaAll: 'Tüm ürünleri gör',

    valuePropsHeading: 'Neden Kron?',
    valuePropsSubheading:
      'Bankacılık, telekom ve kritik altyapılarda kanıtlanmış. On-prem, bulut veya air-gapped dağıtıma uygun.',
    valueProps: [
      {
        icon: 'shield',
        title: 'Varsayılan olarak zero-trust',
        description:
          'Politika tabanlı ayrıcalıklı erişim; tam oturum kaydı, her yerde MFA ve sabotajı belli eden denetim izleri.',
      },
      {
        icon: 'bolt',
        title: 'Saniye altı telemetri',
        description:
          'Saniyede milyonlarca olayı alın, declarative pipeline ile ayrıştırıp yönlendirin — örnekleme ödün vermeden.',
      },
      {
        icon: 'graph',
        title: 'Operasyonel gözlemlenebilirlik',
        description:
          'Log, metrik ve oturum olaylarını tek panoda ilişkilendirerek olay müdahale süresini %80’e kadar kısaltın.',
      },
      {
        icon: 'globe',
        title: 'Her yerde çalışır',
        description:
          'On-prem, private cloud, hyperscaler veya air-gapped. Hibrit topolojiler kutudan çıkar çıkmaz desteklenir.',
      },
    ],

    latestBlogHeading: 'Son içerikler',
    latestBlogSubheading:
      'Kron ekibinden mühendislik derinlemesineleri, güvenlik araştırmaları ve ürün duyuruları.',
    latestBlogEmpty: 'Yeni içerikler yolda. Yakında tekrar uğrayın.',
    latestBlogCtaAll: 'Blog’u ziyaret et',

    ctaHeading: 'Kendi verinizle Kron’u iş başında görün.',
    ctaSubheading:
      'Çözüm mühendislerimizle 30 dakikalık kişisel canlı gezinti — slayt değil, sizin telemetrileriniz.',
    ctaPrimary: 'Demo Planla',
    ctaSecondary: 'Satış ile Görüş',
  },
  products: {
    breadcrumbHome: 'Ana Sayfa',
    breadcrumbProducts: 'Ürünler',
    heroCta: 'Demo Talep Et',
    heroSecondaryCta: 'Satış ile İletişim',
    solutionDefaultHeading: 'Çözüm',
    howItWorksDefaultHeading: 'Nasıl çalışır',
    keyBenefitsDefaultHeading: 'Temel faydalar',
    productFamilyDefaultHeading: 'Ürün ailesi',
    videosDefaultHeading: 'İzle',
    relatedHeading: 'İlgili ürünler',
    notFoundTitle: 'Ürün bulunamadı',
    notFoundDescription:
      'Aradığınız ürün bu dilde yayınlanmamış olabilir.',
    notFoundCta: 'Tüm ürünleri gör',
  },
  contact: {
    heroEyebrow: 'İletişim',
    contactTitle: 'Ekibimizle iletişime geçin',
    contactSubtitle:
      'Sorularınız, geri bildirimleriniz veya iş birliği talepleriniz için bize mesaj gönderin. Genellikle bir iş günü içinde yanıt veriyoruz.',
    demoTitle: 'Demo talep edin',
    demoSubtitle:
      "Kron'u canlı görün. Ortamınızı anlatın, ekibinize özel bir sunum planlayalım.",
    breadcrumbHome: 'Ana Sayfa',
    breadcrumbContact: 'İletişim',
    breadcrumbDemo: 'Demo Talebi',
    fieldName: 'Ad Soyad',
    fieldEmail: 'Kurumsal e-posta',
    fieldCompany: 'Şirket',
    fieldPhone: 'Telefon',
    fieldJobTitle: 'Ünvan',
    fieldProductInterest: 'İlgilenilen ürün',
    fieldMessage: 'Mesaj',
    placeholderName: 'Ayşe Yılmaz',
    placeholderEmail: 'ayse@sirket.com',
    placeholderCompany: 'Şirket A.Ş.',
    placeholderPhone: '+90 555 000 00 00',
    placeholderJobTitle: 'Güvenlik Sorumlusu',
    placeholderProductInterest: 'Single Connect, Double Octopus …',
    placeholderMessage: 'Nasıl yardımcı olabiliriz?',
    optionalLabel: 'opsiyonel',
    submitContact: 'Mesaj gönder',
    submitDemo: 'Demo talep et',
    submitLoading: 'Gönderiliyor…',
    successTitle: 'Teşekkürler!',
    successContactDescription:
      'Mesajınız bize ulaştı. Bir uzmanımız kısa süre içinde sizinle iletişime geçecek.',
    successDemoDescription:
      'Demo talebiniz alındı. En kısa sürede randevu için sizinle iletişime geçeceğiz.',
    successNewSubmission: 'Yeni bir mesaj gönder',
    errorTitle: 'Gönderim başarısız',
    errorGeneric:
      'Talebiniz iletilemedi. Lütfen biraz sonra tekrar deneyin.',
    errorRateLimited:
      'Ağınızdan çok fazla gönderim yapıldı. Lütfen bir süre sonra tekrar deneyin.',
    errorRecaptcha:
      'Bot doğrulaması başarısız oldu. Sayfayı yenileyip tekrar deneyin.',
    privacyNotice:
      'Formu göndererek paylaştığınız verilerin işlenmesini kabul etmiş olursunuz.',
    officesHeading: 'Ofislerimiz',
    officesEmpty: 'Ofis listesi şu anda görüntülenemiyor.',
    validation: {
      nameMin: 'Ad en az 2 karakter olmalıdır.',
      nameMax: 'Ad 120 karakterden uzun olamaz.',
      emailInvalid: 'Lütfen geçerli bir e-posta girin.',
      companyRequired: 'Demo talepleri için şirket bilgisi zorunludur.',
      companyMax: 'Şirket adı 160 karakterden uzun olamaz.',
      messageMin: 'Talebinizi açıklayın (en az 10 karakter).',
      messageMax: 'Mesaj 5000 karakterden uzun olamaz.',
      phoneInvalid: 'Lütfen geçerli bir telefon numarası girin.',
    },
  },
  resources: {
    title: 'Kaynaklar',
    subtitle:
      'Veri sayfaları, vaka analizleri ve beyaz kitaplar — güvenlik ekiplerinin Kron’u üretimde nasıl kullandığını öğrenin.',
    breadcrumbHome: 'Ana Sayfa',
    breadcrumbResources: 'Kaynaklar',
    filterAll: 'Tümü',
    filterDatasheet: 'Veri Sayfaları',
    filterCasestudy: 'Vaka Analizleri',
    filterWhitepaper: 'Beyaz Kitaplar',
    typeDatasheet: 'Veri Sayfası',
    typeCasestudy: 'Vaka Analizi',
    typeWhitepaper: 'Beyaz Kitap',
    emptyTitle: 'Henüz kaynak yok.',
    emptyDescription:
      'Yeni materyaller hazırlanıyor — kısa süre sonra tekrar kontrol edin.',
    downloadCta: 'PDF İndir',
    viewDetailCta: 'Daha fazla',
    noFile: 'İndirme mevcut değil',
    relatedHeading: 'İlgili kaynaklar',
    notFoundTitle: 'Kaynak bulunamadı',
    notFoundDescription:
      'Aradığınız kaynak mevcut değil ya da bu dilde yayınlanmamış olabilir.',
    notFoundCta: 'Kaynaklara dön',
    paginationPrev: 'Önceki',
    paginationNext: 'Sonraki',
    paginationPage: 'Sayfa',
  },
  blog: {
    blogTitle: 'Blog',
    blogSubtitle:
      'Ayrıcalıklı erişim, gözlemlenebilirlik ve telemetri mühendisliği üzerine derinlikli yazılar — Kron ekibinden.',
    newsTitle: 'Haberler',
    newsSubtitle: 'Ürün duyuruları, müşteri hikayeleri ve güncellemeler.',
    breadcrumbHome: 'Ana Sayfa',
    breadcrumbBlog: 'Blog',
    breadcrumbNews: 'Haberler',
    filterAll: 'Tüm yazılar',
    filterHighlight: 'Öne çıkanlar',
    emptyListTitle: 'Henüz içerik yok.',
    emptyListDescription: 'Yeni yazılar yolda — kısa süre sonra tekrar kontrol edin.',
    typeBlog: 'Makale',
    typeNews: 'Haber',
    publishedOn: 'Yayın tarihi',
    minRead: 'dk okuma',
    authorBy: 'Yazar',
    viewsLabel: 'görüntülenme',
    tocHeading: 'Bu sayfada',
    faqHeading: 'Sık sorulan sorular',
    relatedHeading: 'İlgili yazılar',
    notFoundTitle: 'Yazı bulunamadı',
    notFoundDescription:
      'Aradığınız içerik mevcut değil ya da bu dilde yayınlanmamış olabilir.',
    notFoundCta: 'Bloga dön',
    paginationPrev: 'Önceki',
    paginationNext: 'Sonraki',
    paginationPage: 'Sayfa',
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, tr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
