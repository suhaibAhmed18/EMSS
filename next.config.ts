import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript errors should be fixed before production
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
