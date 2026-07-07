#!/usr/bin/env node
/**
 * =============================================================================
 *  BACKUP AUTOMÁTICO DE TURSO → VERCEL BLOB STORAGE
 * =============================================================================
 *
 *  Script de backup para "Las Pastas de Orlando".
 *
 *  Qué hace:
 *    1. Se conecta a la DB de Turso (o cualquier libSQL/SQLite).
 *    2. Dumpea TODAS las tablas (schema + datos) a un archivo .sql.
 *    3. Comprime con gzip → archivo .sql.gz.
 *    4. Sube el archivo a Vercel Blob Storage en backups/laspastasdeorlando-YYYYMMDD-HHMMSS.sql.gz
 *    5. Lista los backups existentes y elimina los más antiguos
 *       (mantiene solo los últimos N, default 30).
 *
 *  Subcomandos:
 *    node scripts/backup-turso.mjs                  # Backup (default)
 *    node scripts/backup-turso.mjs backup           # Backup explícito
 *    node scripts/backup-turso.mjs list             # Listar backups en Blob
 *    node scripts/backup-turso.mjs download         # Descargar el backup más reciente
 *    node scripts/backup-turso.mjs download --date 20260115  # Descargar backup específico
 *    node scripts/backup-turso.mjs restore --to file:./prisma/dev.db  # Restaurar en DB local
 *
 *  Flags:
 *    --dry-run           No sube ni elimina nada, solo muestra
 *    --no-upload         Solo genera el .sql.gz local, no sube a Blob
 *    --local <path>      Guarda copia local del .sql.gz en <path>
 *    --keep N            Mantiene solo los últimos N backups (default 30)
 *    --db <url>          Override de DATABASE_URL
 *    --verbose, -v       Log detallado
 *
 *  Variables de entorno:
 *    - DATABASE_URL / TURSO_DATABASE_URL: URL de la DB (libsql://... o file:...)
 *    - TURSO_AUTH_TOKEN / DATABASE_AUTH_TOKEN: token de Turso
 *    - BLOB_READ_WRITE_TOKEN: token de Vercel Blob Storage (requerido para upload/list/download)
 *
 *  Diseñado para correr en:
 *    - GitHub Actions (cron diario, ver .github/workflows/backup-turso-diario.yml)
 *    - Local (manual o cron del sistema)
 * =============================================================================
 */

import { createClient } from '@libsql/client'
import { mkdir, writeFile, readFile, unlink, access } from 'fs/promises'
import { gzip, gunzip } from 'zlib'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// ===== FLAGS DE LÍNEA DE COMANDOS =====
const args = process.argv.slice(2)
const VERBOSE = args.includes('--verbose') || args.includes('-v')
const DRY_RUN = args.includes('--dry-run')
const NO_UPLOAD = args.includes('--no-upload')

const dbFlagIdx = args.indexOf('--db')
const DB_OVERRIDE = (dbFlagIdx !== -1 && dbFlagIdx + 1 < args.length) ? args[dbFlagIdx + 1] : null

const localFlagIdx = args.indexOf('--local')
const LOCAL_PATH = (localFlagIdx !== -1 && localFlagIdx + 1 < args.length) ? args[localFlagIdx + 1] : null

const keepFlagIdx = args.indexOf('--keep')
const KEEP_COUNT = (keepFlagIdx !== -1 && keepFlagIdx + 1 < args.length) ? parseInt(args[keepFlagIdx + 1], 10) : (parseInt(process.env.BACKUP_RETENTION_COUNT || '30', 10) || 30)

const dateFlagIdx = args.indexOf('--date')
const DATE_FILTER = (dateFlagIdx !== -1 && dateFlagIdx + 1 < args.length) ? args[dateFlagIdx + 1] : null

const toFlagIdx = args.indexOf('--to')
const TO_DB = (toFlagIdx !== -1 && toFlagIdx + 1 < args.length) ? args[toFlagIdx + 1] : null

// Subcomando (primer arg que no empieza con -- y no es valor de un flag con argumento)
const FLAGS_WITH_VALUE = ['--db', '--local', '--keep', '--date', '--to']
function findSubcommand() {
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a.startsWith('--')) {
      // Si es un flag con valor, saltar el siguiente
      if (FLAGS_WITH_VALUE.includes(a) && i + 1 < args.length) {
        i++
      }
      continue
    }
    return a
  }
  return 'backup'
}
const SUBCOMMAND = findSubcommand()

const VERBOSE_LOG = (...a) => { if (VERBOSE) console.log('  [debug]', ...a) }

// ===== UTILIDADES =====

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function tsToDisplay(ts) {
  // YYYYMMDD-HHMMSS → YYYY-MM-DD HH:MM:SS
  if (!ts || ts.length !== 15) return ts
  return `${ts.substring(0, 4)}-${ts.substring(4, 6)}-${ts.substring(6, 8)} ${ts.substring(9, 11)}:${ts.substring(11, 13)}:${ts.substring(13, 15)}`
}

async function loadEnvFile() {
  const envPath = path.join(PROJECT_ROOT, '.env')
  try {
    const content = await readFile(envPath, 'utf8')
    let loaded = 0
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.substring(0, eqIdx).trim()
      let value = trimmed.substring(eqIdx + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1)
      }
      if (!(key in process.env)) {
        process.env[key] = value
        loaded++
      }
    }
    if (loaded > 0) console.log(`  ℹ️  Cargadas ${loaded} variables desde .env`)
  } catch {
    // .env no existe
  }
}

async function fileExists(p) {
  try { await access(p); return true } catch { return false }
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(2)} MB`
}

// ===== ESCAPE DE VALORES SQL =====

function sqlEscape(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) return 'NULL'
    return String(value)
  }
  if (typeof value === 'bigint') return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    // BLOB → hex literal X'...'
    return `X'${Buffer.from(value).toString('hex')}'`
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`
  }
  // String: escapar comillas simples duplicándolas
  const s = String(value).replace(/'/g, "''")
  return `'${s}'`
}

// ===== DUMP DE LA BASE DE DATOS =====

/**
 * Genera un dump SQL completo de la DB.
 * Formato compatible con sqlite3 CLI:
 *   PRAGMA foreign_keys=OFF;
 *   BEGIN TRANSACTION;
 *   -- Table: X
 *   DROP TABLE IF EXISTS "X";
 *   CREATE TABLE "X" (...);
 *   INSERT INTO "X" VALUES (...);
 *   ...
 *   COMMIT;
 */
async function generateSqlDump(db) {
  const parts = []
  const startTime = Date.now()

  // Header
  parts.push('-- ============================================================')
  parts.push('-- Backup de base de datos - Las Pastas de Orlando')
  parts.push(`-- Generado: ${new Date().toISOString()}`)
  parts.push(`-- DB: ${process.env.DATABASE_URL?.replace(/(authToken=)[^&]+/, '$1***') || '(unknown)'}`)
  parts.push('-- ============================================================')
  parts.push('')
  parts.push('PRAGMA foreign_keys=OFF;')
  parts.push('BEGIN TRANSACTION;')
  parts.push('')

  // Listar todas las tablas (excluir tablas internas de sqlite)
  const tablesResult = await db.execute(
    `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_KV' ORDER BY name`
  )

  const tables = tablesResult.rows
  console.log(`  📋 Encontradas ${tables.length} tablas`)

  let totalRows = 0
  for (const t of tables) {
    const tableName = String(t.name)
    const createSql = t.sql ? String(t.sql) : null

    parts.push(`-- Table: ${tableName}`)

    if (!createSql) {
      parts.push(`-- ⚠️ No se pudo obtener el CREATE TABLE para ${tableName}`)
      parts.push('')
      continue
    }

    // DROP + CREATE
    parts.push(`DROP TABLE IF EXISTS "${tableName}";`)
    parts.push(createSql.endsWith(';') ? createSql : createSql + ';')
    parts.push('')

    // INSERTs
    let rowsResult
    try {
      rowsResult = await db.execute(`SELECT * FROM "${tableName}"`)
    } catch (e) {
      parts.push(`-- ⚠️ Error al leer ${tableName}: ${e.message}`)
      parts.push('')
      continue
    }

    const rows = rowsResult.rows
    totalRows += rows.length

    if (rows.length === 0) {
      parts.push(`-- (tabla vacía)`)
      parts.push('')
      continue
    }

    // Obtener nombres de columnas desde la primera fila
    const columns = rowsResult.columns

    for (const row of rows) {
      const values = columns.map(c => sqlEscape(row[c]))
      parts.push(`INSERT INTO "${tableName}" VALUES (${values.join(', ')});`)
    }
    parts.push('')

    VERBOSE_LOG(`${tableName}: ${rows.length} filas`)
  }

  // Índices
  parts.push('-- ============================================================')
  parts.push('-- Índices')
  parts.push('-- ============================================================')
  try {
    const indexesResult = await db.execute(
      `SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY name`
    )
    for (const idx of indexesResult.rows) {
      const idxSql = String(idx.sql)
      parts.push(idxSql.endsWith(';') ? idxSql : idxSql + ';')
    }
  } catch (e) {
    parts.push(`-- ⚠️ Error al leer índices: ${e.message}`)
  }
  parts.push('')

  // Triggers
  parts.push('-- ============================================================')
  parts.push('-- Triggers')
  parts.push('-- ============================================================')
  try {
    const triggersResult = await db.execute(
      `SELECT name, sql FROM sqlite_master WHERE type='trigger' AND sql IS NOT NULL ORDER BY name`
    )
    for (const trg of triggersResult.rows) {
      const trgSql = String(trg.sql)
      parts.push(trgSql.endsWith(';') ? trgSql : trgSql + ';')
    }
  } catch (e) {
    parts.push(`-- ⚠️ Error al leer triggers: ${e.message}`)
  }
  parts.push('')

  parts.push('COMMIT;')
  parts.push('')

  const sql = parts.join('\n')
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`  ✅ Dump generado: ${formatBytes(Buffer.byteLength(sql))} en ${elapsed}s (${totalRows} filas)`)

  return { sql, tableCount: tables.length, totalRows }
}

// ===== VERCEL BLOB =====

async function getBlobModule() {
  try {
    return await import('@vercel/blob')
  } catch (e) {
    throw new Error('@vercel/blob no está instalado. Ejecutá: bun install @vercel/blob (o npm install @vercel/blob)')
  }
}

async function listBackups() {
  const { list } = await getBlobModule()
  let cursor
  const all = []
  while (true) {
    const result = await list({ prefix: 'backups/', cursor, limit: 1000 })
    all.push(...result.blobs)
    if (result.hasMore && result.cursor) {
      cursor = result.cursor
    } else {
      break
    }
  }
  // Filtrar solo .sql.gz
  const backups = all.filter(b => b.url.endsWith('.sql.gz') || b.pathname.endsWith('.sql.gz'))
  // Ordenar por uploadedAt descendente (más reciente primero)
  backups.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
  return backups
}

async function uploadBackup(sqlContent, backupName) {
  const { put } = await getBlobModule()
  const compressed = await gzipAsync(Buffer.from(sqlContent, 'utf8'))
  const blobPath = `backups/${backupName}`
  console.log(`  📦 Subiendo a Vercel Blob: ${blobPath} (${formatBytes(compressed.length)} comprimido)...`)
  const blob = await put(blobPath, compressed, {
    access: 'public',
    contentType: 'application/gzip',
    addRandomSuffix: false,
  })
  console.log(`  ✅ Subido: ${blob.url}`)
  return { url: blob.url, size: compressed.length, pathname: blobPath }
}

async function downloadBackup(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return buf
}

async function deleteBackup(blob) {
  const { del } = await getBlobModule()
  await del(blob.url)
}

// ===== COMANDOS =====

async function cmdBackup(db) {
  console.log('\n📦 Generando backup...')

  // 1. Dump SQL
  const { sql, tableCount, totalRows } = await generateSqlDump(db)

  // 2. Nombre del archivo
  const backupName = `laspastasdeorlando-${timestamp()}.sql.gz`
  console.log(`  📝 Nombre: ${backupName}`)

  // 3. Guardar local (opcional)
  if (LOCAL_PATH) {
    const compressed = await gzipAsync(Buffer.from(sql, 'utf8'))
    const fullPath = path.resolve(LOCAL_PATH)
    await mkdir(path.dirname(fullPath), { recursive: true })
    await writeFile(fullPath, compressed)
    console.log(`  💾 Guardado local: ${fullPath} (${formatBytes(compressed.length)})`)
  }

  if (NO_UPLOAD) {
    console.log('\n  ⏭️  --no-upload: no se sube a Vercel Blob.')
    // Igual guardamos el .sql en disco para que el usuario lo tenga
    const sqlPath = path.join(PROJECT_ROOT, `${backupName}.sql`)
    await writeFile(sqlPath, sql)
    console.log(`  💾 SQL sin comprimir: ${sqlPath}`)
    return
  }

  if (DRY_RUN) {
    console.log('\n  [DRY-RUN] No se sube ni se elimina nada.')
    return
  }

  // 4. Subir a Vercel Blob
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('\n  ❌ BLOB_READ_WRITE_TOKEN no configurado.')
    console.error('     Obtené tu token en: https://vercel.com/dashboard/stores')
    console.error('     O usá --no-upload para guardar el backup solo localmente.')
    process.exit(1)
  }

  const uploaded = await uploadBackup(sql, backupName)

  // 5. Listar y limpiar backups antiguos
  console.log(`\n🧹 Verificando retención (keep=${KEEP_COUNT})...`)
  const backups = await listBackups()
  console.log(`  Total backups en Blob: ${backups.length}`)

  if (backups.length > KEEP_COUNT) {
    const toDelete = backups.slice(KEEP_COUNT)
    console.log(`  Eliminando ${toDelete.length} backups antiguos:`)
    for (const b of toDelete) {
      const fname = b.pathname || b.url.split('/').pop()
      console.log(`    ❌ ${fname} (${tsToDisplay(b.uploadedAt ? new Date(b.uploadedAt).toISOString().replace(/[-:T]/g, '').substring(0, 8) + '-' + new Date(b.uploadedAt).toISOString().replace(/[-:T]/g, '').substring(9, 15) : '?')})`)
      try {
        await deleteBackup(b)
      } catch (e) {
        console.log(`    ⚠️ No se pudo eliminar ${fname}: ${e.message}`)
      }
    }
  } else {
    console.log(`  ✅ No hay backups para eliminar (hay ${backups.length}, límite ${KEEP_COUNT})`)
  }

  // Resumen final
  console.log('\n' + '━'.repeat(60))
  console.log('📊 RESUMEN DE BACKUP')
  console.log('━'.repeat(60))
  console.log(`  Archivo:        ${backupName}`)
  console.log(`  Tamaño:         ${formatBytes(uploaded.size)} (comprimido)`)
  console.log(`  Tablas:         ${tableCount}`)
  console.log(`  Filas totales:  ${totalRows}`)
  console.log(`  URL:            ${uploaded.url}`)
  console.log(`  Backups en Blob: ${backups.length}`)
  console.log('━'.repeat(60))
}

async function cmdList() {
  console.log('\n📋 Listando backups en Vercel Blob Storage...\n')
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('  ❌ BLOB_READ_WRITE_TOKEN no configurado.')
    process.exit(1)
  }

  const backups = await listBackups()
  if (backups.length === 0) {
    console.log('  (no hay backups)')
    return
  }

  console.log(`  Total: ${backups.length} backup(s)`)
  console.log('  ' + '─'.repeat(90))
  console.log('  #  | Fecha             | Tamaño    | Archivo')
  console.log('  ' + '─'.repeat(90))
  backups.forEach((b, i) => {
    const fname = (b.pathname || b.url.split('/').pop()).replace('backups/', '')
    const date = new Date(b.uploadedAt)
    const dateStr = date.toISOString().substring(0, 19).replace('T', ' ')
    const size = formatBytes(b.size || 0)
    console.log(`  ${String(i + 1).padStart(2)} | ${dateStr} | ${size.padStart(9)} | ${fname}`)
  })
  console.log('  ' + '─'.repeat(90))
  console.log(`  Más reciente: ${backups[0]?.url}`)
  console.log(`  Más antiguo:  ${backups[backups.length - 1]?.url}`)
}

async function cmdDownload() {
  console.log('\n⬇️  Descargando backup desde Vercel Blob...\n')
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('  ❌ BLOB_READ_WRITE_TOKEN no configurado.')
    process.exit(1)
  }

  const backups = await listBackups()
  if (backups.length === 0) {
    console.error('  ❌ No hay backups para descargar.')
    process.exit(1)
  }

  let target
  if (DATE_FILTER) {
    // Buscar backup que contenga la fecha YYYYMMDD
    target = backups.find(b => {
      const fname = b.pathname || b.url.split('/').pop()
      return fname.includes(DATE_FILTER)
    })
    if (!target) {
      console.error(`  ❌ No se encontró backup para la fecha ${DATE_FILTER}.`)
      console.error('     Fechas disponibles:')
      backups.forEach(b => {
        const fname = b.pathname || b.url.split('/').pop()
        console.error(`       ${fname}`)
      })
      process.exit(1)
    }
  } else {
    target = backups[0] // más reciente
  }

  const fname = target.pathname || target.url.split('/').pop()
  console.log(`  Backup seleccionado: ${fname}`)
  console.log(`  Tamaño: ${formatBytes(target.size || 0)}`)
  console.log(`  Descargando...`)

  const buf = await downloadBackup(target.url)
  const outPath = path.join(PROJECT_ROOT, fname.replace('backups/', ''))
  await writeFile(outPath, buf)
  console.log(`  ✅ Guardado en: ${outPath}`)
  console.log(`     (${formatBytes(buf.length)})`)
  console.log(`     Para restaurar: gunzip < ${path.basename(outPath)} | sqlite3 dev.db`)
  console.log(`     O: node scripts/backup-turso.mjs restore --to file:./prisma/dev.db --date ${fname.match(/\d{8}/)?.[0] || 'YYYYMMDD'}`)
}

async function cmdRestore(db) {
  if (!TO_DB) {
    console.error('  ❌ --to <db-url> es requerido para restore.')
    console.error('     Ejemplo: --to file:./prisma/dev.db')
    console.error('     Ejemplo: --to libsql://mi-db.turso.io')
    process.exit(1)
  }

  console.log('\n♻️  Restaurando backup en DB local...\n')
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('  ❌ BLOB_READ_WRITE_TOKEN no configurado.')
    process.exit(1)
  }

  const backups = await listBackups()
  if (backups.length === 0) {
    console.error('  ❌ No hay backups para restaurar.')
    process.exit(1)
  }

  let target
  if (DATE_FILTER) {
    target = backups.find(b => {
      const fname = b.pathname || b.url.split('/').pop()
      return fname.includes(DATE_FILTER)
    })
    if (!target) {
      console.error(`  ❌ No se encontró backup para la fecha ${DATE_FILTER}.`)
      process.exit(1)
    }
  } else {
    target = backups[0]
  }

  const fname = target.pathname || target.url.split('/').pop()
  console.log(`  Backup seleccionado: ${fname}`)
  console.log(`  Descargando...`)
  const compressed = await downloadBackup(target.url)
  console.log(`  Descomprimiendo...`)
  const sqlBuf = await gunzipAsync(compressed)
  const sql = sqlBuf.toString('utf8')
  console.log(`  SQL: ${formatBytes(sql.length)} (${(sql.match(/\n/g) || []).length} líneas)`)

  // Conectar a la DB destino
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
  const targetDb = createClient({ url: TO_DB, authToken: authToken || undefined })

  // Test conexión
  try {
    await targetDb.execute('SELECT 1')
    console.log(`  ✅ Conexión a DB destino: OK`)
  } catch (e) {
    console.error(`  ❌ No se pudo conectar a la DB destino: ${e.message}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log('\n  [DRY-RUN] No se aplicará el restore.')
    return
  }

  // Split SQL en statements
  console.log(`  Parseando statements...`)
  const statements = splitSqlStatements(sql)
  console.log(`  ${statements.length} statements a ejecutar`)

  // Ejecutar en batches
  console.log(`  Aplicando...`)
  const BATCH = 50
  let executed = 0
  for (let i = 0; i < statements.length; i += BATCH) {
    const batch = statements.slice(i, i + BATCH)
    try {
      await targetDb.batch(batch.map(s => ({ sql: s, args: [] })))
    } catch (e) {
      // Si falla el batch, intentar uno por uno para identificar el statement problemático
      for (const s of batch) {
        try {
          await targetDb.execute(s)
        } catch (e2) {
          console.error(`  ⚠️ Error en statement: ${s.substring(0, 100)}...`)
          console.error(`     ${e2.message}`)
        }
      }
    }
    executed += batch.length
    if (executed % 500 === 0 || executed === statements.length) {
      console.log(`  Progreso: ${executed}/${statements.length}`)
    }
  }

  console.log(`\n  ✅ Restore completado: ${executed} statements ejecutados`)
  console.log(`  DB destino: ${TO_DB}`)
}

/**
 * Split seguro de SQL en statements individuales.
 * Respeta strings (comilla simple y doble), comentarios (linea y bloque),
 * bloques BEGIN...END (triggers, funciones), y ; como separador.
 */
function splitSqlStatements(sql) {
  const statements = []
  let current = ''
  let inString = false
  let stringChar = null
  let beginDepth = 0 // profundidad de BEGIN...END (triggers)
  let i = 0

  // Helper: mirar si en la posición actual hay una palabra clave (case-insensitive)
  const matchKeyword = (kw) => {
    if (current.length < kw.length) return false
    // Verificar que la palabra esté al final de current (tras whitespace o inicio)
    const tail = current.slice(-kw.length - 1)
    const re = new RegExp(`(^|\\s)${kw}$`, 'i')
    return re.test(tail)
  }

  while (i < sql.length) {
    const c = sql[i]
    const next = sql[i + 1]

    if (inString) {
      current += c
      if (c === stringChar) {
        if (next === stringChar) {
          current += next
          i += 2
          continue
        }
        inString = false
        stringChar = null
      }
      i++
      continue
    }

    // Comentarios
    if (c === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++
      continue
    }
    if (c === '/' && next === '*') {
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i += 2
      continue
    }

    // Strings
    if (c === "'" || c === '"') {
      inString = true
      stringChar = c
      current += c
      i++
      continue
    }

    // Separador
    if (c === ';') {
      if (beginDepth > 0) {
        // Estamos dentro de BEGIN...END; el ; no es separador
        current += c
        i++
        continue
      }
      const stmt = current.trim()
      if (stmt) statements.push(stmt + ';')
      current = ''
      i++
      continue
    }

    current += c
    i++

    // Detectar BEGIN (entrada a bloque trigger) — solo si no estamos en string
    // y la palabra "BEGIN" aparece como palabra completa al final de current
    if (/\bBEGIN$/i.test(current) && !inString) {
      // Asegurarse de que no sea "BEGIN TRANSACTION" (ese no abre bloque trigger)
      // Mirar lo siguiente: si viene "TRANSACTION" en la misma línea, no es trigger
      const rest = sql.slice(i)
      const restTrimmed = rest.match(/^\s*(\w+)/)
      if (!restTrimmed || !/^TRANSACTION$/i.test(restTrimmed[1])) {
        beginDepth++
      }
    }
    // Detectar END (salida de bloque trigger)
    if (/\bEND$/i.test(current) && !inString && beginDepth > 0) {
      beginDepth--
    }
  }
  const last = current.trim()
  if (last) statements.push(last + (last.endsWith(';') ? '' : ';'))
  return statements
}

// ===== MAIN =====

async function main() {
  console.log('━'.repeat(60))
  console.log('🍝  BACKUP DE TURSO → VERCEL BLOB STORAGE')
  console.log('    Las Pastas de Orlando')
  console.log('━'.repeat(60))
  console.log(`  Subcomando: ${SUBCOMMAND}`)
  console.log(`  Modo: ${DRY_RUN ? '🔍 DRY-RUN' : '⚡ EJECUCIÓN REAL'}`)
  console.log(`  Upload: ${NO_UPLOAD ? '⛔ deshabilitado' : '✅ habilitado'}`)
  console.log(`  Retención: ${KEEP_COUNT} backups`)
  if (LOCAL_PATH) console.log(`  Copia local: ${LOCAL_PATH}`)
  if (DATE_FILTER) console.log(`  Filtro fecha: ${DATE_FILTER}`)
  if (TO_DB) console.log(`  DB destino: ${TO_DB}`)
  console.log(`  Proyecto: ${PROJECT_ROOT}`)

  await loadEnvFile()

  // Para subcomandos list/download/restore no necesitamos conectarnos a la DB source
  // (operan solo con Vercel Blob), salvo restore que conecta a la DB destino.
  if (SUBCOMMAND === 'list') {
    await cmdList()
    return
  }

  if (SUBCOMMAND === 'download') {
    await cmdDownload()
    return
  }

  if (SUBCOMMAND === 'restore') {
    await cmdRestore()
    return
  }

  // Subcomando backup (default)
  const databaseUrl = DB_OVERRIDE || process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL
  if (!databaseUrl) {
    console.error('\n  ❌ DATABASE_URL no configurada.')
    console.error('     Seteala en .env, como env var, o usá --db <url>')
    process.exit(1)
  }

  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
  const maskedUrl = databaseUrl.replace(/(authToken=)[^&]+/, '$1***')
  console.log(`  DB origen: ${maskedUrl}`)

  const db = createClient({ url: databaseUrl, authToken: authToken || undefined })

  try {
    await db.execute('SELECT 1 as ok')
    console.log(`  ✅ Conexión a DB origen: OK`)
  } catch (e) {
    console.error(`\n  ❌ No se pudo conectar a la DB: ${e.message}`)
    process.exit(1)
  }

  await cmdBackup(db)
}

main().catch(e => {
  console.error('\n💥 Error fatal:', e)
  process.exit(1)
})
