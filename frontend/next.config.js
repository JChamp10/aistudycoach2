/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.dicebear.com', 'avatars.githubusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/', permanent: true },
      { source: '/brain', destination: '/', permanent: true },
      { source: '/math', destination: '/', permanent: true },
      { source: '/progress', destination: '/', permanent: true },
      { source: '/study/:path*', destination: '/', permanent: true },
      { source: '/community', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
