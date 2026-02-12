/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  // Removed 'output: export' to enable API routes in production
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
