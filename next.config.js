/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // ✅ PWA cache'ten dolayı eski build'in ekranda kalmasını azaltır:
  // - Yeni SW aktif olur olmaz sayfaları kontrol altına alır
  // - Eski/atıl cache'leri temizler
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // ✅ KRİTİK: Admin API'leri cache'lenmesin (silme/onarım işlemleri anlık yansısın)
    {
      urlPattern: /\/api\/admin\/.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'api-no-cache-admin',
      },
    },
    // ✅ KRİTİK: Akademik analiz sihirbazı API'leri cache'lenmesin (yeni sınav kaydı anlık yansısın)
    {
      urlPattern: /\/api\/akademik-analiz\/.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'api-no-cache-akademik-analiz',
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 gün
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5, // 5 dakika
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 gün
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 gün
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 yıl
        },
      },
    },
  ],
});

const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  swcMinify: true,
  experimental: {
    optimizeCss: false,
  },
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
};

module.exports = withPWA(nextConfig);
// Build trigger: 1767590000
