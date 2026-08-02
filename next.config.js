/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  basePath: '/apps/logo-normalizer',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/apps/logo-normalizer',
  },
};

module.exports = nextConfig;
