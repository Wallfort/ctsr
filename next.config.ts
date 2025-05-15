import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    resolveAlias: {
      '@next/turbo': '@next/turbo/dist/turbo.js'
    }
  }
};

export default nextConfig;
