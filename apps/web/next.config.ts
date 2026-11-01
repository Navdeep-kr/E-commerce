import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@storefront-ops/core',
    '@storefront-ops/db',
    '@storefront-ops/integrations',
    '@storefront-ops/jobs',
    '@storefront-ops/ui',
  ],
};

export default nextConfig;
