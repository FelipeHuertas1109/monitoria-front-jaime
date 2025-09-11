/** @type {import('next').NextConfig} */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? String(process.env.NEXT_PUBLIC_BACKEND_URL).replace(/\/$/, '') : '';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: { document: '/offline' },
  workboxOptions: {
    navigateFallback: '/offline',
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: { cacheName: 'html-cache' },
      },
      {
        urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'asset-cache' },
      },
      {
        urlPattern: ({ request }) => request.destination === 'image',
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // APIs del mismo dominio (Next API routes)
      {
        urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/api/'),
        handler: 'NetworkFirst',
        options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
      },
      // APIs del backend externo (usando NEXT_PUBLIC_BACKEND_URL si está definido)
      ...(backendUrl
        ? [{
            urlPattern: new RegExp('^' + escapeRegex(backendUrl) + '(/|$)'),
            handler: 'NetworkFirst',
            options: { cacheName: 'backend-api-cache', networkTimeoutSeconds: 5 },
          }]
        : []),
    ],
  },
});

const nextConfig = {
  // Configuración para desarrollo con CORS
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ];
  },

  // Headers para CORS en desarrollo
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
