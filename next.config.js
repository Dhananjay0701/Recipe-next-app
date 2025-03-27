/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable optimized loading for more predictable updates
  experimental: {
    // Disable optimized loading for more predictable updates
    disableOptimizedLoading: true,
    // Keep server actions enabled
    serverActions: true
  },
  // Disable image caching to ensure fresh images
  images: {
    minimumCacheTTL: 0
  },
  // Configure middleware to run on specific pages
  async headers() {
    return [
      {
        // Recipe detail page - ensure fresh data
        source: "/:id",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" }
        ]
      },
      {
        // API routes with consistent no-cache policy
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  }
};

export default nextConfig;