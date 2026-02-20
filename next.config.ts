import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/admin/dashboard',
        destination: '/admin/selling',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
