// DB Export script — reads the local SQLite DB and exports schema + data
// Run with: DATABASE_URL="file:./prisma/dev.db" node scripts/export-db.js

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@libsql/client')
const fs = require('fs')

const DB_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const OUTPUT_FILE = `laspastasdeorlando-schema-${new Date().toISOString().split('T')[0]}.sql`

async function main() {
  console.log(`=== EXPORTANDO DB: ${DB_URL} ===\n`)
  const db = new PrismaClient()
  const libsqlClient = createClient({ url: DB_URL })

  // Get all table names
  const tablesResult = await libsqlClient.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name"
  )
  const tableNames = tablesResult.rows.map(r => r.name)

  // Get all indexes
  const indexesResult = await libsqlClient.execute(
    "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name"
  )
  const indexSQLs = indexesResult.rows.map(r => r.sql).filter(Boolean)

  // Get all triggers
  const triggersResult = await libsqlClient.execute(
    "SELECT sql FROM sqlite_master WHERE type='trigger' ORDER BY name"
  )
  const triggerSQLs = triggersResult.rows.map(r => r.sql).filter(Boolean)

  // Get schema (CREATE TABLE statements)
  const schemaResult = await libsqlClient.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name"
  )
  const schemaSQLs = schemaResult.rows.map(r => r.sql).filter(Boolean)

  // Count rows per table
  const tableCounts = {}
  for (const tableName of tableNames) {
    const countResult = await libsqlClient.execute(`SELECT COUNT(*) as count FROM "${tableName}"`)
    tableCounts[tableName] = countResult.rows[0].count
  }

  // Build the SQL file
  let output = ''

  // Header
  output += `-- ============================================\n`
  output += `-- EXPORTACIÓN DE BASE DE DATOS\n`
  output += `-- Sistema: El Amigo de las Pastas (laspastasdeorlando.com.ar)\n`
  output += `-- Fecha de exportación: ${new Date().toISOString()}\n`
  output += `-- Motor: SQLite (local sandbox)\n`
  output += `-- DB URL: ${DB_URL}\n`
  output += `-- Total de tablas: ${tableNames.length}\n`
  output += `-- Prisma: schema.prisma (SQLite provider)\n`
  output += `--\n`
  output += `-- TABLAS Y CANTIDAD DE FILAS:\n`
  for (const [name, count] of Object.entries(tableCounts)) {
    output += `--   ${name}: ${count} fila(s)\n`
  }
  output += `-- ============================================\n\n`

  // SECCIÓN 1: DDL (Estructura)
  output += `-- ============================================\n`
  output += `-- SECCIÓN 1: DDL (Estructura)\n`
  output += `-- ============================================\n\n`
  for (const sql of schemaSQLs) {
    output += sql + ';\n\n'
  }

  // SECCIÓN 2: ÍNDICES
  output += `\n-- ============================================\n`
  output += `-- SECCIÓN 2: ÍNDICES Y CONSTRAINTS\n`
  output += `-- ============================================\n\n`
  for (const sql of indexSQLs) {
    output += sql + ';\n'
  }

  // SECCIÓN 3: TRIGGERS
  if (triggerSQLs.length > 0) {
    output += `\n-- ============================================\n`
    output += `-- SECCIÓN 3: TRIGGERS\n`
    output += `-- ============================================\n\n`
    for (const sql of triggerSQLs) {
      output += sql + ';\n'
    }
  }

  // SECCIÓN 4: DATOS
  output += `\n-- ============================================\n`
  output += `-- SECCIÓN 4: DATOS\n`
  output += `-- (tablas con datos; máximo 100 filas por tabla)\n`
  output += `-- (tablas con passwords/usuarios: solo estructura)\n`
  output += `-- ============================================\n\n`

  const SENSITIVE_TABLES = ['Usuario', 'PasswordReset', 'MigrationLog']
  const MAX_ROWS = 100

  for (const tableName of tableNames) {
    const count = tableCounts[tableName]
    if (count === 0) {
      output += `-- Tabla "${tableName}": 0 filas (vacía)\n\n`
      continue
    }

    if (SENSITIVE_TABLES.includes(tableName)) {
      output += `-- Tabla "${tableName}": ${count} fila(s) — OMITIDA (datos sensibles)\n\n`
      continue
    }

    output += `-- Tabla "${tableName}": ${count} fila(s)${count > MAX_ROWS ? ` (exportando solo ${MAX_ROWS})` : ''}\n`

    // Get column names
    const colsResult = await libsqlClient.execute(`PRAGMA table_info("${tableName}")`)
    const columns = colsResult.rows.map(r => r.name)

    // Get data (limited)
    const limit = Math.min(count, MAX_ROWS)
    const dataResult = await libsqlClient.execute(`SELECT * FROM "${tableName}" LIMIT ${limit}`)

    for (const row of dataResult.rows) {
      const values = columns.map(col => {
        const val = row[col]
        if (val === null) return 'NULL'
        if (typeof val === 'number') return val
        if (typeof val === 'boolean') return val ? 1 : 0
        // Escape strings
        return `'${String(val).replace(/'/g, "''")}'`
      })
      output += `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`
    }
    output += '\n'
  }

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, output)

  // Stats
  const fileSize = fs.statSync(OUTPUT_FILE).size
  const fileSizeKB = (fileSize / 1024).toFixed(2)

  console.log(`\n=== EXPORTACIÓN COMPLETADA ===\n`)
  console.log(`Archivo: ${OUTPUT_FILE}`)
  console.log(`Tamaño: ${fileSizeKB} KB`)
  console.log(`Total de tablas: ${tableNames.length}`)
  console.log(`\nFilas por tabla:`)
  for (const [name, count] of Object.entries(tableCounts)) {
    console.log(`  ${name}: ${count}`)
  }

  await libsqlClient.close()
  await db.$disconnect()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
