import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    largePageDataBytes: 20 * 1000 * 1000, // 20 MB (ڈیفالٹ 128 KB ہے)
  },
};

export default nextConfig;