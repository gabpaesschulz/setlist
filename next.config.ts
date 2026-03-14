import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from any domain for event covers / artist photos
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // PWA headers for manifest and service worker
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type',  value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type',          value: 'application/javascript' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control',          value: 'no-cache' },
        ],
      },
    ];
  },
};

export default nextConfig;
