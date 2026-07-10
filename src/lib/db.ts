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
    { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "seccion" TEXT', desc: 'ProductoTerminado.seccion' },

    // ── Descuentos por Volumen: snapshot fields on DetalleVenta ──
    { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "descuento_volumen_id" INTEGER', desc: 'DetalleVenta.descuento_volumen_id' },
    { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "descuento_volumen_valor" REAL', desc: 'DetalleVenta.descuento_volumen_valor' },
    { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "descuento_volumen_tipo" TEXT', desc: 'DetalleVenta.descuento_volumen_tipo' },
    { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "precio_unitario_original" REAL', desc: 'DetalleVenta.precio_unitario_original' },
    { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "descuento_unitario" REAL', desc: 'DetalleVenta.descuento_unitario' },
    { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "descuento_nombre" TEXT', desc: 'DetalleVenta.descuento_nombre' },

    // ── Descuentos por Volumen: snapshot fields on DetallePresupuesto ──
    { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "descuento_volumen_id" INTEGER', desc: 'DetallePresupuesto.descuento_volumen_id' },
    { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "descuento_volumen_valor" REAL', desc: 'DetallePresupuesto.descuento_volumen_valor' },
    { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "descuento_volumen_tipo" TEXT', desc: 'DetallePresupuesto.descuento_volumen_tipo' },
    { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "precio_unitario_original" REAL', desc: 'DetallePresupuesto.precio_unitario_original' },
    { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "descuento_unitario" REAL', desc: 'DetallePresupuesto.descuento_unitario' },
    { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "descuento_nombre" TEXT', desc: 'DetallePresupuesto.descuento_nombre' },

    // ── CREATE TABLE Promocion (if not exists) ──────────────
    { sql: `CREATE TABLE IF NOT EXISTS "Promocion" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "nombre" TEXT NOT NULL,
      "descripcion" TEXT,
      "tipo" TEXT NOT NULL,
      "valor_descuento" REAL NOT NULL DEFAULT 0,
      "fecha_inicio" DATETIME NOT NULL,
      "fecha_fin" DATETIME,
      "activo" BOOLEAN NOT NULL DEFAULT 1,
      "aplicar_auto" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME
    )`, desc: 'Promocion table' },

    // ── CREATE TABLE PromocionProducto (if not exists) ──────
    { sql: `CREATE TABLE IF NOT EXISTS "PromocionProducto" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "id_promocion" INTEGER NOT NULL,
      "id_producto_terminado" INTEGER NOT NULL,
      "id_categoria" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("id_promocion") REFERENCES "Promocion"("id") ON DELETE CASCADE,
      FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado"("id"),
      FOREIGN KEY ("id_categoria") REFERENCES "CategoriaProductoTerminado"("id")
    )`, desc: 'PromocionProducto table' },
    { sql: 'CREATE INDEX IF NOT EXISTS "PromocionProducto_id_promocion_idx" ON "PromocionProducto"("id_promocion")', desc: 'PromocionProducto_id_promocion_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "PromocionProducto_id_producto_terminado_idx" ON "PromocionProducto"("id_producto_terminado")', desc: 'PromocionProducto_id_producto_terminado_idx' },

    // ── CREATE TABLE DescuentoVolumen (if not exists) ──────
    { sql: `CREATE TABLE IF NOT EXISTS "DescuentoVolumen" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "nombre" TEXT NOT NULL,
      "descripcion" TEXT,
      "tipo_item" TEXT NOT NULL,
      "item_id" INTEGER,
      "unidad_medida" TEXT NOT NULL,
      "activo" BOOLEAN NOT NULL DEFAULT 1,
      "fecha_inicio" DATETIME,
      "fecha_fin" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME
    )`, desc: 'DescuentoVolumen table' },
    { sql: 'CREATE INDEX IF NOT EXISTS "DescuentoVolumen_tipo_item_idx" ON "DescuentoVolumen"("tipo_item")', desc: 'DescuentoVolumen_tipo_item_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "DescuentoVolumen_activo_idx" ON "DescuentoVolumen"("activo")', desc: 'DescuentoVolumen_activo_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "DescuentoVolumen_fecha_idx" ON "DescuentoVolumen"("fecha_inicio","fecha_fin")', desc: 'DescuentoVolumen_fecha_idx' },

    // ── CREATE TABLE DescuentoVolumenRango (if not exists) ──────
    { sql: `CREATE TABLE IF NOT EXISTS "DescuentoVolumenRango" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "id_descuento" INTEGER NOT NULL,
      "cantidad_desde" REAL NOT NULL,
      "cantidad_hasta" REAL,
      "tipo_descuento" TEXT NOT NULL,
      "valor" REAL NOT NULL,
      "descripcion" TEXT,
      FOREIGN KEY ("id_descuento") REFERENCES "DescuentoVolumen"("id") ON DELETE CASCADE
    )`, desc: 'DescuentoVolumenRango table' },
    { sql: 'CREATE INDEX IF NOT EXISTS "DescuentoVolumenRango_id_descuento_idx" ON "DescuentoVolumenRango"("id_descuento")', desc: 'DescuentoVolumenRango_id_descuento_idx' },

    // ── CREATE TABLE RecetaCocina (módulo independiente de recetas de cocina) ──
    { sql: `CREATE TABLE IF NOT EXISTS "RecetaCocina" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "titulo" TEXT NOT NULL,
      "descripcion" TEXT,
      "ingredientes" TEXT NOT NULL,
      "pasos" TEXT NOT NULL,
      "tiempo_preparacion" TEXT,
      "tiempo_coccion" TEXT,
      "dificultad" TEXT NOT NULL DEFAULT 'facil',
      "imagen" TEXT,
      "categoria" TEXT DEFAULT 'otros',
      "visible_en_landing" BOOLEAN NOT NULL DEFAULT 0,
      "destacado" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME
    )`, desc: 'RecetaCocina table' },
    { sql: 'CREATE INDEX IF NOT EXISTS "RecetaCocina_categoria_idx" ON "RecetaCocina"("categoria")', desc: 'RecetaCocina_categoria_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "RecetaCocina_visible_en_landing_idx" ON "RecetaCocina"("visible_en_landing")', desc: 'RecetaCocina_visible_en_landing_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "RecetaCocina_destacado_idx" ON "RecetaCocina"("destacado")', desc: 'RecetaCocina_destacado_idx' },

    // ── CREATE TABLE ConfigDocumento (configuración de PDFs — singleton id=1) ──
    {
    sql: `CREATE TABLE IF NOT EXISTS "ConfigDocumento" (
      "id" INTEGER PRIMARY KEY DEFAULT 1,
      "empresa_nombre" TEXT NOT NULL DEFAULT 'Pastas Orlando',
      "empresa_direccion" TEXT NOT NULL DEFAULT 'Posadas, Misiones',
      "empresa_telefono" TEXT NOT NULL DEFAULT '3754-419324',
      "empresa_email" TEXT NOT NULL DEFAULT 'laspastasdeorlando@gmail.com',
      "empresa_cuit" TEXT NOT NULL DEFAULT '20-12345678-9',
      "empresa_condicion" TEXT NOT NULL DEFAULT 'Responsable Inscripto',
      "empresa_inicio_act" TEXT NOT NULL DEFAULT '01/2018',
      "logo_url" TEXT,
      "footer_texto" TEXT NOT NULL DEFAULT 'Documento no fiscal — Para uso interno',
      "mostrar_qr" BOOLEAN NOT NULL DEFAULT 1,
      "qr_url_base" TEXT NOT NULL DEFAULT '',
      "texto_condiciones" TEXT NOT NULL DEFAULT 'La mercadería debe entregarse en condiciones óptimas. Cualquier diferencia debe notificarse dentro de las 48 hs.',
      "color_acento" TEXT NOT NULL DEFAULT '#E1AD01',
      "updatedAt" DATETIME
    )`, desc: 'ConfigDocumento table'
    },
    // Seed default singleton row (idempotent — INSERT OR IGNORE)
    { sql: `INSERT OR IGNORE INTO "ConfigDocumento" ("id") VALUES (1)`, desc: 'ConfigDocumento seed row' },

    // ── CREATE TABLE DocumentoGenerado (historial de documentos generados) ──
    {
    sql: `CREATE TABLE IF NOT EXISTS "DocumentoGenerado" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "tipo" TEXT NOT NULL,
      "entidad_id" INTEGER NOT NULL,
      "entidad_tipo" TEXT NOT NULL,
      "formato" TEXT NOT NULL DEFAULT 'pdf',
      "generado_por" INTEGER,
      "email_enviado" BOOLEAN NOT NULL DEFAULT 0,
      "destinatario" TEXT,
      "metadata" TEXT,
      "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("generado_por") REFERENCES "Usuario"("id")
    )`, desc: 'DocumentoGenerado table'
    },
    { sql: 'CREATE INDEX IF NOT EXISTS "DocumentoGenerado_tipo_idx" ON "DocumentoGenerado"("tipo")', desc: 'DocumentoGenerado_tipo_idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "DocumentoGenerado_entidad_tipo_entidad_id_idx" ON "DocumentoGenerado"("entidad_tipo", "entidad_id")', desc: 'DocumentoGenerado composite idx' },
    { sql: 'CREATE INDEX IF NOT EXISTS "DocumentoGenerado_fecha_idx" ON "DocumentoGenerado"("fecha")', desc: 'DocumentoGenerado_fecha_idx' },
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
