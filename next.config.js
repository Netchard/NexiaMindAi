/** @type {import('next').NextConfig} */
const { withBundleAnalyzer } = require('@next/bundle-analyzer');

const nextConfig = {
  // Optimisation pour Vercel
  // output: 'standalone', // Pour les API Routes

  // Note: La configuration expérimentale pour @supabase/supabase-js n'est pas nécessaire
  // dans Next.js 16+ pour le client-side. Les packages externes sont supportés par défaut.

  // Pour éviter les erreurs CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        ],
      },
    ];
  },
  // Optimisation des images pour ST-309
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Formats optimisés
    formats: ['image/avif', 'image/webp'],
    // Tailles par défaut
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

// Export avec et sans bundle analyzer selon l'environnement
module.exports = process.env.ANALYZE === 'true'
  ? withBundleAnalyzer({ ...nextConfig, analyzeBrowser: ['browser', 'both'] })
  : nextConfig;