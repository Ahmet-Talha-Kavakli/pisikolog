import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Use ESM friendly approach for next-pwa if possible
// For Next.js 15, we might need a different wrapper or just ignore the require for now
// as many PWA plugins are still updating ESM support
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

export default withPWA(nextConfig);
