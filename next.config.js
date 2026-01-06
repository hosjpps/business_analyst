/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,

  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Убираем X-Powered-By header
  poweredByHeader: false,

  // Сжатие
  compress: true,

  // Экспериментальные оптимизации
  experimental: {
    // Оптимизация импортов пакетов
    optimizePackageImports: [
      'react-markdown',
      'react-syntax-highlighter',
      '@supabase/supabase-js',
    ],
  },

  // Webpack оптимизации
  webpack: (config, { isServer }) => {
    // Оптимизация для клиента
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
