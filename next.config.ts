import type { NextConfig } from "next";

// CRITICAL: Prisma reads DATABASE_URL_FILE from schema.prisma
// We need DATABASE_URL_FILE to always be a valid file: URL for Prisma
// The actual Turso connection URL is in DATABASE_URL (runtime) or TURSO_DATABASE_URL
const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
  ],
  env: {
    // Always set DATABASE_URL_FILE to a valid file: URL for Prisma validation
    // At runtime, the Turso adapter in db.ts handles the actual connection
    DATABASE_URL_FILE: 'file:./dev.db',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
