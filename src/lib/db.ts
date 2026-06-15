// IMPORTANT: db-env.ts MUST be imported BEFORE @prisma/client
// It sets DATABASE_URL_FILE env var that Prisma reads from the schema
import './db-env'

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient, type Client } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  tursoMigrated: boolean | undefined
  tursoMigratePromise: Promise<void> | undefined
}

/**
 * Auto-migrate Turso database: ensure all columns from the Prisma schema exist.
 * This runs once per cold start and is idempotent (ALTER TABLE ADD COLUMN fails
 * gracefully if the column already exists).
 */
async function autoMigrateTurso(client: Client) {
  if (globalForPrisma.tursoMigrated) return
  globalForPrisma.tursoMigrated = true

  const migrations = [
    // ── CREATE TABLES (idempotent — IF NOT EXISTS) ──────────────
    { sql: `CREATE TABLE IF NOT EXISTS "PasswordReset" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "email" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "usado" BOOLEAN NOT NULL DEFAULT 0,
      "fecha_expiracion" DATETIME NOT NULL,
      "ip" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`, desc: 'PasswordReset table' },
    { sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "PasswordReset_token_key" ON "PasswordReset"("token")', desc: 'PasswordReset_token_key' },
    { sql: 'CREATE INDEX IF NOT EXISTS "PasswordReset_token_idx" ON "PasswordReset"("token")', desc: 'PasswordReset_token_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "PasswordReset_email_idx" ON "PasswordReset"("email")', desc: 'PasswordReset_email_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "PasswordReset_fecha_expiracion_idx" ON "PasswordReset"("fecha_expiracion")', desc: 'PasswordReset_fecha_expiracion_idx' },

    // ── CREATE TABLE Consulta (if not exists) ──────────────
    { sql: `CREATE TABLE IF NOT EXISTS "Consulta" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "nombre" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "telefono" TEXT NOT NULL,
      "mensaje" TEXT NOT NULL,
      "leido" BOOLEAN NOT NULL DEFAULT 0,
      "respondido" BOOLEAN NOT NULL DEFAULT 0,
      "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`, desc: 'Consulta table' },
    { sql: 'CREATE INDEX IF NOT EXISTS "Consulta_fecha_idx" ON "Consulta"("fecha")', desc: 'Consulta_fecha_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "Consulta_leido_idx" ON "Consulta"("leido")', desc: 'Consulta_leido_idx' },

    // ── ALTER TABLE (column additions — idempotent) ──────────
    { sql: 'ALTER TABLE "Opinion" ADD COLUMN "email" TEXT', desc: 'Opinion.email' },
    { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "codigo_barras" TEXT', desc: 'ProductoTerminado.codigo_barras' },
    { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "tipo_harina" TEXT', desc: 'ProductoTerminado.tipo_harina' },
    { sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "ProductoTerminado_codigo_barras_key" ON "ProductoTerminado"("codigo_barras")', desc: 'ProductoTerminado_codigo_barras_key' },
    { sql: 'ALTER TABLE "CategoriaProductoTerminado" ADD COLUMN "imagen" TEXT', desc: 'CategoriaProductoTerminado.imagen' },
    { sql: 'ALTER TABLE "DetallePedidoCliente" ADD COLUMN "codigo_barras_escaner" TEXT', desc: 'DetallePedidoCliente.codigo_barras_escaner' },
    { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "codigo_barras_escaner" TEXT', desc: 'DetalleVenta.codigo_barras_escaner' },
    { sql: 'ALTER TABLE "DetalleCompra" ADD COLUMN "codigo_barras_escaner" TEXT', desc: 'DetalleCompra.codigo_barras_escaner' },
    { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "observaciones" TEXT', desc: 'DetallePresupuesto.observaciones' },
    { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "unidades" INTEGER', desc: 'ProductoTerminado.unidades' },
    { sql: 'ALTER TABLE "CategoriaProductoTerminado" ADD COLUMN "imagen_integral" TEXT', desc: 'CategoriaProductoTerminado.imagen_integral' },
    { sql: 'ALTER TABLE "CategoriaProductoTerminado" ADD COLUMN "imagen_sin_gluten" TEXT', desc: 'CategoriaProductoTerminado.imagen_sin_gluten' },
    { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "modo_coccion" TEXT', desc: 'ProductoTerminado.modo_coccion' },
    { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "texto_frente" TEXT', desc: 'ProductoTerminado.texto_frente' },
    { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "texto_reverso" TEXT', desc: 'ProductoTerminado.texto_reverso' },
    { sql: 'ALTER TABLE "CategoriaProductoTerminado" ADD COLUMN "seccion" TEXT', desc: 'CategoriaProductoTerminado.seccion' },
  ]

  // Data migrations: set seccion for known categories (idempotent — WHERE seccion IS NULL)
  const dataMigrations = [
    { sql: `UPDATE "CategoriaProductoTerminado" SET "seccion" = 'pastas' WHERE "nombre" IN ('Sorrentinos', 'Ñoquis', 'Tallarines', 'Cintas Anchas', 'Ravioles', 'Tapas', 'Pastas frescas', 'Pastas secas', 'Salsas', 'Lasagnas y canelones') AND "seccion" IS NULL`, desc: 'Set seccion=pastas for known pasta categories' },
    { sql: `UPDATE "CategoriaProductoTerminado" SET "seccion" = 'horneados' WHERE "nombre" IN ('Empanadas', 'Tartas') AND "seccion" IS NULL`, desc: 'Set seccion=horneados for known horneado categories' },
  ]

  for (const migration of migrations) {
    try {
      await client.execute(migration.sql)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      // "duplicate column name" or "already exists" means the migration was already applied
      if (!errMsg.includes('duplicate column name') && !errMsg.includes('already exists')) {
        console.error(`[DB Auto-Migrate] ERROR: ${migration.desc}:`, errMsg)
      }
    }
  }

  // Run data migrations (UPDATE statements — idempotent via WHERE conditions)
  for (const migration of dataMigrations) {
    try {
      await client.execute(migration.sql)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(`[DB Auto-Migrate] DATA ERROR: ${migration.desc}:`, errMsg)
    }
  }

  console.log('[DB Auto-Migrate] Turso schema verified ✓')
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || ''
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || ''

  // Detect if we need to use the Turso/libSQL adapter
  const isTurso =
    tursoUrl.startsWith('libsql://') ||
    tursoUrl.startsWith('http://') ||
    tursoUrl.startsWith('https://')

  if (isTurso) {
    console.log(`[DB] Using Turso/libSQL adapter (url: ${tursoUrl.substring(0, 30)}...)`)

    // CRITICAL: In Prisma v6, PrismaLibSQL expects a CONFIG OBJECT, not a client instance.
    // The adapter internally calls createClient(config) during connect().
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    })

    const prisma = new PrismaClient({
      adapter,
    })

    // Auto-migrate Turso on first connection (idempotent)
    // Store the promise so API routes can await it before querying
    const libsqlClient = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    })
    globalForPrisma.tursoMigratePromise = autoMigrateTurso(libsqlClient).catch((err) => {
      console.error('[DB Auto-Migrate] Failed:', err)
    })

    return prisma
  }

  // Local SQLite (file: protocol) - no adapter needed
  console.log(`[DB] Using local SQLite`)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Await Turso auto-migration before querying.
 * Call this at the start of API routes that depend on recently-added columns.
 * On local SQLite this resolves immediately; on Turso it waits for ALTER TABLE to finish.
 */
export async function ensureDbReady() {
  if (globalForPrisma.tursoMigratePromise) {
    await globalForPrisma.tursoMigratePromise
  }
}
