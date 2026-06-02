// IMPORTANT: db-env.ts MUST be imported BEFORE @prisma/client
// It sets DATABASE_URL_FILE env var that Prisma reads from the schema
import './db-env'

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient, type Client } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  tursoMigrated: boolean | undefined
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
    const libsqlClient = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    })
    autoMigrateTurso(libsqlClient).catch((err) => {
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
