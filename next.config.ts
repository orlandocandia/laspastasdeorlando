import type { NextConfig } from "next";

// CRITICAL: Prisma reads DATABASE_URL_FILE from schema.prisma
// We need DATABASE_URL_FILE to always be a valid file: URL for Prisma
// The actual Turso connection URL is in DATABASE_URL (runtime) or TURSO_DATABASE_URL
const nextConfig: NextConfig = {
  // Standalone build — produces a self-contained server in .next/standalone
  // that can be deployed without node_modules (only a minimal subset is bundled).
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
  ],
  // Ensure Prisma's generated client + query engine binaries are included
  // in the standalone output (they are loaded dynamically and would otherwise
  // be missed by the import tracer).
  outputFileTracingIncludes: {
    '/': ['./node_modules/.prisma/**/*', './node_modules/@prisma/client/**/*', './prisma/**/*'],
  },
  env: {
    // Always set DATABASE_URL_FILE to a valid file: URL for Prisma validation
    // At runtime, the Turso adapter in db.ts handles the actual connection
    DATABASE_URL_FILE: 'file:./dev.db',
  },
  images: {
    // NOTE: Removed `unoptimized: true` to enable automatic WebP/AVIF conversion
    // and responsive srcset generation on Vercel. This is the #1 image perf optimization.
    // Force browser to download images instead of displaying them
    // when accessed directly via URL (prevents easy image saving)
    contentDispositionType: 'attachment',
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
