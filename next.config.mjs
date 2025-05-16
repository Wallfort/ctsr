/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {
    resolveAlias: {
      '@next/turbo': '@next/turbo/dist/turbo.js'
    }
  }
};

export default nextConfig; 