// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   async headers() {
//     console.log('Applying CORS headers to API routes'); // Debug log
//     return [
//       {
//         // Enable CORS for all API routes
//         source: "/api/:path*",
//         headers: [
//           { key: "Access-Control-Allow-Credentials", value: "true" },
//           { key: "Access-Control-Allow-Origin", value: "*" },
//           { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
//           { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
//         ],
//       },]}}

// module.exports = nextConfig;