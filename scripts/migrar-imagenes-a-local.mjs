#!/usr/bin/env node
/**
 * =============================================================================
 *  MIGRAR IMÁGENES EXTERNAS → RUTAS LOCALES
 * =============================================================================
 *
 *  Script de migración para "Las Pastas de Orlando".
 *
 *  Problema que resuelve:
 *    - La base de datos local contiene URLs de imágenes que apuntan a
 *      fuentes externas (Vercel Blob Storage, https://laspastasdeorlando.vercel.app/...,
 *      u otras). Esas URLs no se cargan en el sistema local porque el deploy
 *      de Vercel fue dado de baja o el Blob Store ya no es accesible.
 *
 *  Qué hace este script:
 *    1. Hace un backup de la base de datos local (dev.db → dev.db.backup-YYYYMMDD-HHMMSS).
 *    2. Escanea TODAS las tablas con campos de imagen.
 *    3. Para cada URL externa encontrada:
 *       a. Si es https://laspastasdeorlando.vercel.app/<path> → convierte a /<path>
 *          (asume que el archivo ya existe en public/ o lo descarga si puede).
 *       b. Si es https://<cualquier-dominio>/... → intenta descargar la imagen
 *          y la guarda en public/images/productos/<tabla>/<id>-<nombre>.<ext>.
 *       c. Si la descarga falla, deja la URL original y emite un warning.
 *    4. Si BLOB_READ_WRITE_TOKEN está configurado, lista TODOS los blobs de
 *       Vercel Blob Storage y los descarga a public/images/uploads/<subdir>/.
 *    5. Modo --dry-run: muestra qué haría sin tocar la DB ni descargar nada.
 *
 *  Uso:
 *    node scripts/migrar-imagenes-a-local.mjs              # Ejecuta migración real
 *    node scripts/migrar-imagenes-a-local.mjs --dry-run    # Solo muestra, no modifica
 *    node scripts/migrar-imagenes-a-local.mjs --no-download # Solo corrige rutas, no descarga
 *    node scripts/migrar-imagenes-a-local.mjs --verbose    # Log detallado
 *    node scripts/migrar-imagenes-a-local.mjs --blob-only  # Solo descarga Vercel Blob
 *
 *  Requisitos:
 *    - Node.js >= 18 (para fetch nativo)
 *    - Dependencias del proyecto: @libsql/client, @vercel/blob (opcional)
 *
 *  Variables de entorno:
 *    - DATABASE_URL: si no está, usa file:./prisma/dev.db por defecto
 *    - TURSO_AUTH_TOKEN / DATABASE_AUTH_TOKEN: si DATABASE_URL es libsql://
 *    - BLOB_READ_WRITE_TOKEN: para descargar todos los blobs de Vercel
 *
 *  Salida:
 *    - Backup de la DB en prisma/dev.db.backup-YYYYMMDD-HHMMSS
 *    - Imágenes descargadas en public/images/productos/ y public/images/uploads/
 *    - DB actualizada con rutas /images/... en lugar de URLs externas
 * =============================================================================
 */

import { createClient } from '@libsql/client'
import { mkdir, writeFile, copyFile, access, readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// ===== CARGAR .env LOCAL (si existe) =====
// Esto permite que el script respete la configuración local del usuario
// sin requerir que exporte las variables manualmente.
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
      // Quitar comillas
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1)
      }
      // Solo setear si no está ya en process.env (env vars explícitas tienen prioridad)
      if (!(key in process.env)) {
        process.env[key] = value
        loaded++
      }
    }
    if (loaded > 0) console.log(`  ℹ️  Cargadas ${loaded} variables desde .env`)
  } catch {
    // .env no existe, no es error
  }
}

// ===== FLAGS DE LÍNEA DE COMANDOS =====
const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_DOWNLOAD = process.argv.includes('--no-download')
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v')
const BLOB_ONLY = process.argv.includes('--blob-only')
const FORCE = process.argv.includes('--force')

// --db <path>: override DATABASE_URL explícitamente
// Tiene prioridad sobre todo lo demás (env vars y .env)
const dbFlagIdx = process.argv.indexOf('--db')
const DB_OVERRIDE = (dbFlagIdx !== -1 && dbFlagIdx + 1 < process.argv.length)
  ? process.argv[dbFlagIdx + 1]
  : null

// ===== CONFIGURACIÓN =====
const VERBOSE_LOG = (...args) => { if (VERBOSE) console.log('  [debug]', ...args) }

// Dominios de Vercel que sabemos que están dados de baja
const VERCEL_DEAD_DOMAINS = [
  'laspastasdeorlando.vercel.app',
  'pastasorlando.vercel.app',
  'pastas-de-orlando.vercel.app',
  'pastasdeorlando.vercel.app',
]

// Tablas con campos de imagen (orden de procesamiento)
const TABLES = [
  { table: 'ProductoTerminado', columns: ['imagen'], subdir: 'productos-terminados' },
  { table: 'Producto', columns: ['imagen'], subdir: 'productos' },
  { table: 'CategoriaProductoTerminado', columns: ['imagen', 'imagen_integral', 'imagen_sin_gluten'], subdir: 'categorias' },
  { table: 'MateriaPrima', columns: ['imagen'], subdir: 'materias-primas' },
  { table: 'Insumo', columns: ['imagen'], subdir: 'insumos' },
  { table: 'Usuario', columns: ['imagen'], subdir: 'usuarios' },
  { table: 'Persona', columns: ['imagen'], subdir: 'personas' },
]

// Extensiones de imagen válidas
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']
const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024 // 10 MB
const DOWNLOAD_TIMEOUT_MS = 15000

// ===== ESTADÍSTICAS =====
const stats = {
  backups: 0,
  rowsScanned: 0,
  rowsWithExternalUrl: 0,
  urlsConverted: 0,
  urlsDownloaded: 0,
  urlsFailed: 0,
  blobItems: 0,
  blobDownloaded: 0,
  blobFailed: 0,
  tablesProcessed: 0,
  startTime: Date.now(),
}

// ===== UTILIDADES =====
function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function isExternalUrl(value) {
  if (!value || typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  return v.startsWith('http://') || v.startsWith('https://')
}

function isVercelBlobUrl(url) {
  return url.includes('.public.blob.vercel-storage.com') ||
         url.includes('.vercel-storage.com') ||
         url.startsWith('https://blob.vercel.com')
}

function isDeadVercelUrl(url) {
  return VERCEL_DEAD_DOMAINS.some(d => url.includes(`://${d}`))
}

function getExtensionFromUrl(url) {
  try {
    const u = new URL(url)
    const pathname = u.pathname
    const ext = path.extname(pathname).toLowerCase()
    if (IMAGE_EXTENSIONS.includes(ext)) return ext
    return '.png'
  } catch {
    return '.png'
  }
}

function sanitizeFilename(name) {
  return String(name || 'producto')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

function deriveLocalPathFromVercelUrl(url) {
  // https://laspastasdeorlando.vercel.app/images/uploads/productos-terminados/abc.png
  // → /images/uploads/productos-terminados/abc.png
  try {
    const u = new URL(url)
    return u.pathname // ya empieza con /
  } catch {
    return null
  }
}

async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function downloadImage(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'laspastasdeorlando-migrator/1.0',
        'Accept': 'image/*,*/*;q=0.8',
      },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    const contentType = res.headers.get('content-type') || ''
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_DOWNLOAD_SIZE) {
      throw new Error(`Archivo demasiado grande: ${contentLength} bytes (max ${MAX_DOWNLOAD_SIZE})`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0) throw new Error('Respuesta vacía')
    if (buf.length > MAX_DOWNLOAD_SIZE) {
      throw new Error(`Archivo descargado demasiado grande: ${buf.length} bytes`)
    }
    let ext = getExtensionFromUrl(url)
    if (contentType.includes('image/png')) ext = '.png'
    else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) ext = '.jpg'
    else if (contentType.includes('image/webp')) ext = '.webp'
    else if (contentType.includes('image/gif')) ext = '.gif'
    else if (contentType.includes('image/svg')) ext = '.svg'
    return { buffer: buf, ext, contentType, size: buf.length }
  } finally {
    clearTimeout(timeout)
  }
}

// ===== LÓGICA PRINCIPAL =====

async function backupDatabase(dbPath) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Saltando backup de DB`)
    return null
  }
  const backupPath = `${dbPath}.backup-${timestamp()}`
  try {
    await copyFile(dbPath, backupPath)
    stats.backups++
    console.log(`  ✅ Backup creado: ${path.basename(backupPath)}`)
    return backupPath
  } catch (e) {
    console.error(`  ❌ Error al hacer backup: ${e.message}`)
    throw e
  }
}

async function tryDownloadAndSave(url, table, id, nombre, subdir) {
  try {
    const { buffer, ext, size } = await downloadImage(url)
    const targetDir = path.join(PROJECT_ROOT, 'public', 'images', 'productos', subdir)
    await mkdir(targetDir, { recursive: true })
    const slug = sanitizeFilename(nombre)
    const filename = `${id}-${slug}${ext}`
    const fullPath = path.join(targetDir, filename)
    await writeFile(fullPath, buffer)
    const localUrl = `/images/productos/${subdir}/${filename}`
    console.log(`  ✅ Descargada (${(size / 1024).toFixed(1)} KB) → ${localUrl}`)
    return { localUrl, fullPath, size }
  } catch (e) {
    console.log(`  ❌ Falló descarga: ${e.message}`)
    return null
  }
}

async function processTable(db, tableConfig) {
  const { table, columns, subdir } = tableConfig
  console.log(`\n📋 Procesando tabla: ${table} (columnas: ${columns.join(', ')})`)

  // Verificar que la tabla existe
  try {
    await db.execute(`SELECT 1 FROM "${table}" LIMIT 1`)
  } catch (e) {
    console.log(`  ⏭️  Tabla no existe o no accesible: ${e.message.split('\n')[0]}`)
    return
  }

  // Construir SELECT (con 'nombre' si existe)
  const cols = ['id', 'nombre', ...columns].join(', ')
  let rows
  try {
    const result = await db.execute(`SELECT ${cols} FROM "${table}"`)
    rows = result.rows
  } catch (e) {
    try {
      const cols2 = ['id', ...columns].join(', ')
      const result = await db.execute(`SELECT ${cols2} FROM "${table}"`)
      rows = result.rows
    } catch (e2) {
      console.log(`  ⏭️  No se pudo leer la tabla: ${e2.message.split('\n')[0]}`)
      return
    }
  }

  console.log(`  Total filas: ${rows.length}`)
  stats.rowsScanned += rows.length
  stats.tablesProcessed++

  for (const row of rows) {
    const id = row.id
    const nombre = row.nombre || `id-${id}`
    for (const col of columns) {
      const value = row[col]
      if (!isExternalUrl(value)) continue

      stats.rowsWithExternalUrl++
      VERBOSE_LOG(`[${table}#${id}] ${col} = ${value.substring(0, 80)}...`)

      let newUrl = null

      // CASO 1: URL de Vercel dado de baja
      if (isDeadVercelUrl(value)) {
        const localPath = deriveLocalPathFromVercelUrl(value)
        if (localPath) {
          const fullPath = path.join(PROJECT_ROOT, 'public', localPath)
          const exists = await fileExists(fullPath)
          if (exists) {
            newUrl = localPath
            console.log(`  ✅ #${id} ${col}: ${value.substring(0, 50)}... → ${localPath} (archivo existe)`)
          } else if (!SKIP_DOWNLOAD && !DRY_RUN) {
            console.log(`  ⬇️  #${id} ${col}: descargando desde Vercel (puede fallar)...`)
            const downloaded = await tryDownloadAndSave(value, table, id, nombre, subdir)
            if (downloaded) {
              newUrl = downloaded.localUrl
              stats.urlsDownloaded++
            } else {
              newUrl = localPath
              console.log(`  ⚠️  #${id} ${col}: no se pudo descargar, convirtiendo ruta a ${localPath} (archivo faltante)`)
            }
          } else {
            newUrl = localPath
            console.log(`  ${DRY_RUN ? '🔍' : '⚠️'}  #${id} ${col}: → ${localPath} ${DRY_RUN ? '(dry-run)' : '(archivo faltante)'}`)
          }
        }
      }
      // CASO 2: URL de Vercel Blob Storage
      else if (isVercelBlobUrl(value)) {
        if (!SKIP_DOWNLOAD && !DRY_RUN) {
          console.log(`  📦 #${id} ${col}: descargando desde Vercel Blob...`)
          const downloaded = await tryDownloadAndSave(value, table, id, nombre, subdir)
          if (downloaded) {
            newUrl = downloaded.localUrl
            stats.urlsDownloaded++
          } else {
            stats.urlsFailed++
            console.log(`  ❌ #${id} ${col}: falló descarga de Blob, se deja URL original`)
          }
        } else {
          console.log(`  ${DRY_RUN ? '🔍' : '⏭️'}  #${id} ${col}: Vercel Blob URL ${DRY_RUN ? '(dry-run, se descargaría)' : '(skipped por --no-download)'}`)
        }
      }
      // CASO 3: Otra URL externa
      else {
        if (!SKIP_DOWNLOAD && !DRY_RUN) {
          console.log(`  🌐 #${id} ${col}: descargando desde URL externa...`)
          const downloaded = await tryDownloadAndSave(value, table, id, nombre, subdir)
          if (downloaded) {
            newUrl = downloaded.localUrl
            stats.urlsDownloaded++
          } else {
            stats.urlsFailed++
            console.log(`  ❌ #${id} ${col}: falló descarga, se deja URL original`)
          }
        } else {
          console.log(`  ${DRY_RUN ? '🔍' : '⏭️'}  #${id} ${col}: URL externa ${DRY_RUN ? '(dry-run)' : '(skipped)'}`)
        }
      }

      // Actualizar DB
      if (newUrl && newUrl !== value && !DRY_RUN) {
        try {
          await db.execute({
            sql: `UPDATE "${table}" SET "${col}" = ? WHERE id = ?`,
            args: [newUrl, id],
          })
          stats.urlsConverted++
        } catch (e) {
          console.error(`  ❌ Error al UPDATE ${table}.${col} para id=${id}: ${e.message}`)
          stats.urlsFailed++
        }
      }
    }
  }
}

async function downloadAllBlobs(db) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.log('\n📦 BLOB_READ_WRITE_TOKEN no configurado — saltando descarga masiva de Vercel Blob.')
    console.log('   Para descargar TODOS los blobs (incluyendo huérfanos), setear BLOB_READ_WRITE_TOKEN.')
    return
  }

  console.log('\n📦 Listando todos los blobs de Vercel Blob Storage...')
  let blobModule
  try {
    blobModule = await import('@vercel/blob')
  } catch (e) {
    console.error('  ❌ @vercel/blob no está instalado. Ejecutá: bun install @vercel/blob  (o npm install @vercel/blob)')
    return
  }

  const { list } = blobModule
  let cursor
  let totalBlobs = 0
  let downloaded = 0
  let failed = 0
  const allBlobs = []

  while (true) {
    const result = await list({ cursor, limit: 1000 })
    allBlobs.push(...result.blobs)
    totalBlobs += result.blobs.length
    if (result.hasMore && result.cursor) {
      cursor = result.cursor
    } else {
      break
    }
  }

  console.log(`  Total blobs en Vercel Blob Storage: ${totalBlobs}`)
  stats.blobItems = totalBlobs

  if (DRY_RUN) {
    console.log('  [DRY-RUN] No se descargará nada, solo listando URLs:')
    for (const blob of allBlobs.slice(0, 20)) {
      console.log(`    - ${blob.url}`)
    }
    if (allBlobs.length > 20) console.log(`    ... y ${allBlobs.length - 20} más`)
    return
  }

  for (const blob of allBlobs) {
    const url = blob.url
    let pathname
    try {
      pathname = new URL(url).pathname // /uploads/productos-terminados/abc.png
    } catch {
      continue
    }
    const targetPath = path.join(PROJECT_ROOT, 'public', pathname)
    const targetDir = path.dirname(targetPath)

    try {
      await mkdir(targetDir, { recursive: true })
      const { buffer } = await downloadImage(url)
      await writeFile(targetPath, buffer)
      downloaded++
      stats.blobDownloaded++
      if (VERBOSE || downloaded % 10 === 0) {
        console.log(`  ✅ [${downloaded}/${totalBlobs}] ${pathname}`)
      }
    } catch (e) {
      failed++
      stats.blobFailed++
      console.log(`  ❌ [${downloaded + failed}/${totalBlobs}] ${pathname}: ${e.message}`)
    }
  }

  console.log(`\n  📦 Blobs descargados: ${downloaded}/${totalBlobs} (fallidos: ${failed})`)
}

async function main() {
  console.log('━'.repeat(70))
  console.log('🍝  MIGRAR IMÁGENES EXTERNAS → RUTAS LOCALES')
  console.log('    Las Pastas de Orlando')
  console.log('━'.repeat(70))
  console.log(`  Modo: ${DRY_RUN ? '🔍 DRY-RUN (no modifica nada)' : '⚡ EJECUCIÓN REAL'}`)
  console.log(`  Descargas: ${SKIP_DOWNLOAD ? '⛔ deshabilitadas (--no-download)' : '✅ habilitadas'}`)
  console.log(`  Solo Blob: ${BLOB_ONLY ? '✅ sí' : '❌ no'}`)
  console.log(`  Verbose: ${VERBOSE ? '✅ sí' : '❌ no'}`)
  console.log(`  Proyecto: ${PROJECT_ROOT}`)

  // Cargar .env local si existe (respeta la configuración del usuario)
  await loadEnvFile()

  // --db <path> tiene prioridad máxima
  const databaseUrl = DB_OVERRIDE || process.env.DATABASE_URL || `file:${path.join(PROJECT_ROOT, 'prisma', 'dev.db')}`
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
  const maskedUrl = databaseUrl.replace(/(authToken=)[^&]+/, '$1***')
  console.log(`  DB: ${maskedUrl}${DB_OVERRIDE ? ' (vía --db)' : ''}`)

  const db = createClient({
    url: databaseUrl,
    authToken: authToken || undefined,
  })

  try {
    await db.execute('SELECT 1 as ok')
    console.log('  ✅ Conexión a DB: OK')
  } catch (e) {
    console.error(`  ❌ No se pudo conectar a la DB: ${e.message}`)
    process.exit(1)
  }

  if (databaseUrl.startsWith('file:')) {
    const dbPath = databaseUrl.replace(/^file:/, '')
    if (await fileExists(dbPath)) {
      console.log('\n💾 Haciendo backup de la base de datos...')
      await backupDatabase(dbPath)
    } else {
      console.log(`\n⚠️  Archivo DB no encontrado: ${dbPath}`)
    }
  } else {
    console.log('\n☁️  DB remota (Turso/libsql) — no se hace backup local.')
    console.log('   (Hacé un backup desde el dashboard de Turso antes de continuar.)')
    if (!FORCE && !DRY_RUN) {
      console.log('   Usá --force para confirmar que ya hiciste backup.')
      process.exit(1)
    }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await downloadAllBlobs(db)
    if (BLOB_ONLY) {
      console.log('\n⏭️  --blob-only: saltando migración de URLs en DB.')
      printStats()
      return
    }
  } else if (BLOB_ONLY) {
    console.log('\n❌ --blob-only requiere BLOB_READ_WRITE_TOKEN.')
    process.exit(1)
  }

  console.log('\n' + '━'.repeat(70))
  console.log('📊 ESCANEO Y MIGRACIÓN DE URLs EN LA BASE DE DATOS')
  console.log('━'.repeat(70))
  for (const t of TABLES) {
    await processTable(db, t)
  }

  printStats()
}

function printStats() {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1)
  console.log('\n' + '━'.repeat(70))
  console.log('📊 RESUMEN FINAL')
  console.log('━'.repeat(70))
  console.log(`  Tiempo total:           ${elapsed}s`)
  console.log(`  Backups creados:        ${stats.backups}`)
  console.log(`  Tablas procesadas:      ${stats.tablesProcessed}`)
  console.log(`  Filas escaneadas:       ${stats.rowsScanned}`)
  console.log(`  Filas con URL externa:  ${stats.rowsWithExternalUrl}`)
  console.log(`  URLs convertidas:       ${stats.urlsConverted}`)
  console.log(`  Imágenes descargadas:   ${stats.urlsDownloaded}`)
  console.log(`  Descargas fallidas:     ${stats.urlsFailed}`)
  if (stats.blobItems > 0) {
    console.log(`  Blobs listados:         ${stats.blobItems}`)
    console.log(`  Blobs descargados:      ${stats.blobDownloaded}`)
    console.log(`  Blobs fallidos:         ${stats.blobFailed}`)
  }
  console.log('━'.repeat(70))

  if (DRY_RUN) {
    console.log('🔍 Modo DRY-RUN: no se modificó nada.')
    console.log('   Ejecutá sin --dry-run para aplicar los cambios.')
  } else {
    if (stats.urlsFailed > 0) {
      console.log(`⚠️  ${stats.urlsFailed} URL(s) no se pudieron descargar.`)
      console.log('   Esas URLs quedaron como están en la DB.')
      console.log('   Revisá los logs arriba para ver cuáles son.')
    }
    if (stats.rowsWithExternalUrl === 0) {
      console.log('✅ No se encontraron URLs externas en la DB. Nada que migrar.')
    } else if (stats.urlsConverted > 0) {
      console.log(`✅ Migración exitosa: ${stats.urlsConverted} URL(s) convertidas a rutas locales.`)
      console.log('   Reiniciá el servidor local para ver las imágenes.')
    }
  }
  console.log('━'.repeat(70))
}

main().catch(e => {
  console.error('\n💥 Error fatal:', e)
  process.exit(1)
})
