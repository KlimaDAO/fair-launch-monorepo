import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ['nextstepjs'],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
