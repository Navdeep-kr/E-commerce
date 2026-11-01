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
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        path: false,
        url: false,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
    }
    return config;
  },
};

export default nextConfig;
