import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TODO: Fix remaining TypeScript errors and set to false
    // Currently 100+ type errors need to be resolved
    // See FIXES_COMPLETED.md for details
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
