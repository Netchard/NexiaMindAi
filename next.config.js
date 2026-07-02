/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisation pour Vercel
  output: 'standalone', // Pour les API Routes

  // Pour les embeddings de grande taille
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },

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