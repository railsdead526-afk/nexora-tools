import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Matikan cache disk agar tidak memicu warning di memori HP
      config.cache = false;
      config.watchOptions = {
        ignored: ['**/node_modules/**', '/data/**', '/storage/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
