/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@qrgen/shared', '@qrgen/qr-engine'],
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    // In production nginx routes /api and /r directly to the backend before requests ever reach
    // Next.js; this rewrite exists so `next dev` (and any request that does slip through) works
    // the same way without needing a second origin/CORS in the browser.
    const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      { source: '/r/:path*', destination: `${apiUrl}/api/r/:path*` },
    ];
  },
};

export default nextConfig;
