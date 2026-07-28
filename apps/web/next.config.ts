import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@gymapp/ui-components', '@gymapp/shared-types', '@gymapp/shared-schemas'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
    ],
  },
};

export default nextConfig;
