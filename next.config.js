/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;