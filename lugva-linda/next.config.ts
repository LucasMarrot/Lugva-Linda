import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.192'],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
