import type { NextConfig } from "next";

// CRITICAL: Prisma reads DATABASE_URL_FILE from schema.prisma
// We need DATABASE_URL_FILE to always be a valid file: URL for Prisma
// The actual Turso connection URL is in DATABASE_URL (runtime) or TURSO_DATABASE_URL

// Standalone build SOLO para el paquete local (self-hosting en PC).
// En Vercel NO se usa standalone (causa problemas de build con 111 API routes).
// El script build-local-package.sh setea BUILD_STANDALONE=1 antes de compilar.
const isStandaloneBuild = process.env.BUILD_STANDALONE === '1'

const nextConfig: NextConfig = {
  // output: 'standalone' solo cuando se construye el paquete local
  ...(isStandaloneBuild ? { output: "standalone" as const } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
  ],
  // Tracing de Prisma solo necesario en standalone (paquete local).
  // En Vercel, Prisma se resuelve via node_modules normal.
  ...(isStandaloneBuild ? {
    outputFileTracingIncludes: {
      '/': ['./node_modules/.prisma/**/*', './node_modules/@prisma/client/**/*', './prisma/**/*'],
    },
  } : {}),
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
