import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/dashboard/1',
      },
    ]
  },
};

export default nextConfig;
