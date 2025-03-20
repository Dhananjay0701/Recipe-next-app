/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['localhost'],
    },
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*', // Adjust this to point to your API server
        },
      ];
    },
    // This is important for handling static files
    publicRuntimeConfig: {
      staticFolder: '/static',
    },
  };
  
  export default nextConfig;