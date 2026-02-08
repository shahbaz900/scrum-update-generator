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
  // GitHub Pages requires trailing slashes, but Vercel doesn't
  trailingSlash: process.env.VERCEL ? false : true,
  // Only use basePath for non-Vercel production deployments (e.g., GitHub Pages)
  basePath: process.env.VERCEL ? '' : (process.env.NODE_ENV === 'production' ? '/scrum-update-generator' : ''),
};

module.exports = nextConfig;
