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
      // {
      //   // API routes with consistent no-cache policy
      //   // source: "/api/:path*",
      //   // headers: [
      //   //   { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
      //   //   { key: "Pragma", value: "no-cache" },
      //   //   { key: "Expires", value: "0" },
      //   // ],
      // },
    ];
  }
};

export default nextConfig;