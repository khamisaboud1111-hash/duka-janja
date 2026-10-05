const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@supabase/supabase-js'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), fullscreen=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://server.arcgisonline.com",
              "connect-src 'self' https://*.supabase.co https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://server.arcgisonline.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // HTTP/2 Server Push for critical assets
          {
            key: 'Link',
            value: [
              '</_next/static/css/228f3dc5d3c92c1e.css>; rel=preload; as=style',
              '</_next/static/css/b5b4f5fa168d8532.css>; rel=preload; as=style',
              '</_next/static/chunks/webpack-eb12a09c74ecd682.js>; rel=preload; as=script',
              '</_next/static/chunks/fd9d1056-158ac2c9d594a992.js>; rel=preload; as=script',
              '</_next/static/chunks/7023-ce3bf3217b919106.js>; rel=preload; as=script',
              '</_next/static/chunks/main-app-b8d8f654a4c3de8b.js>; rel=preload; as=script',
              '</_next/static/media/e4af272ccee01ff0-s.p.woff2>; rel=preload; as=font; crossorigin',
              '</_next/static/media/6245472ced48d3be-s.p.woff2>; rel=preload; as=font; crossorigin',
              '</_next/static/media/7db6c35d839a711c-s.p.woff2>; rel=preload; as=font; crossorigin',
              '</_next/static/media/8888a3826f4a3af4-s.p.woff2>; rel=preload; as=font; crossorigin',
              '</_next/static/media/b957ea75a84b6ea7-s.p.woff2>; rel=preload; as=font; crossorigin',
            ].join(', '),
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);