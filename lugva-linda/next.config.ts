import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.105',
    '192.168.1.192',
    '163.173.90.204',
    '163.173.88.254',
  ],
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    optimizePackageImports: [
      '@/components/shared',
      '@/components/ui',
      'lucide-react',
      'date-fns',
    ],
  },
};

export default nextConfig;
