/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages requires trailing slashes and proper asset prefix
  trailingSlash: true,
  // Base path will be the repository name for GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/scrum-update-generator' : '',
};

module.exports = nextConfig;
