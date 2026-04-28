/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Docker multi-stage build için — `next start` yerine sadece Node.js ile
  // `node .next/standalone/server.js` koşabilmek için.
  output: 'standalone',

  // Tipli route'lar. Özellikle redirect middleware ve `<Link href>` kontrolünde
  // compile-time fayda sağlar.
  experimental: {
    typedRoutes: true,
  },

  images: {
    remotePatterns: [
      // MinIO / S3 (backend'den presigned URL ile gelen media)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      {
        protocol: 'https',
        hostname: 'minio.krontech.com',
      },
      // Prod üretim için CDN/AWS S3 domain'ini buraya ekleyeceğiz.
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
