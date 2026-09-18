/**
 * Test del script de migración con descargas REALES.
 * Usa un placeholder image service público para verificar que la descarga funciona.
 */
import { createClient } from '@libsql/client'
import { mkdir, rm, writeFile, copyFile, readdir, stat } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const TEST_DIR = path.join(PROJECT_ROOT, '.test-download')
const TEST_DB_PATH = path.join(TEST_DIR, 'test.db')
const TEST_PUBLIC = path.join(TEST_DIR, 'public')

async function main() {
  console.log('🧪 TEST DE DESCARGA REAL DE IMÁGENES\n')

  await rm(TEST_DIR, { recursive: true, force: true })
  await mkdir(TEST_DIR, { recursive: true })

  console.log('1️⃣  Creando DB con URLs reales descargables...')
  const db = createClient({ url: `file:${TEST_DB_PATH}` })
  await db.execute(`
    CREATE TABLE ProductoTerminado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      imagen TEXT
    )
  `)

  // Usar URLs reales que devuelvan imágenes pequeñas
  // placeholder.com / placehold.co sirven para esto
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, imagen) VALUES (?, ?, ?)`,
    args: [1, 'Sorrentinos Test', 'https://placehold.co/200x200/png'],
  })
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, imagen) VALUES (?, ?, ?)`,
    args: [2, 'Ravioles Test', 'https://placehold.co/300x300/jpg'],
  })

  // Setup test env
  const testScriptsDir = path.join(TEST_DIR, 'scripts')
  await mkdir(testScriptsDir, { recursive: true })
  await copyFile(
    path.join(PROJECT_ROOT, 'scripts', 'migrar-imagenes-a-local.mjs'),
    path.join(testScriptsDir, 'migrar-imagenes-a-local.mjs')
  )
  await copyFile(
    path.join(PROJECT_ROOT, 'package.json'),
    path.join(TEST_DIR, 'package.json')
  )
  try { await rm(path.join(TEST_DIR, 'node_modules')) } catch {}
  await execSync(`ln -s ${PROJECT_ROOT}/node_modules ${path.join(TEST_DIR, 'node_modules')}`)

  console.log('\n2️⃣  Ejecutando script con descargas habilitadas...')
  try {
    execSync(`node scripts/migrar-imagenes-a-local.mjs --verbose`, {
      cwd: TEST_DIR,
      env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('Error:', e.message)
  }

  // Verificar que las imágenes se descargaron
  console.log('\n3️⃣  Verificando imágenes descargadas:')
  const productosDir = path.join(TEST_PUBLIC, 'images', 'productos', 'productos-terminados')
  let allOk = true
  try {
    const files = await readdir(productosDir)
    console.log(`  Archivos en ${productosDir}:`)
    for (const f of files) {
      const s = await stat(path.join(productosDir, f))
      console.log(`    - ${f} (${s.size} bytes)`)
    }
    if (files.length !== 2) {
      console.log(`  ❌ Esperaba 2 archivos, encontré ${files.length}`)
      allOk = false
    } else {
      // Verificar que las URLs en la DB se actualizaron
      const after = await db.execute('SELECT id, nombre, imagen FROM ProductoTerminado ORDER BY id')
      for (const r of after.rows) {
        console.log(`  PT#${r.id} ${r.nombre}: ${r.imagen}`)
        if (!r.imagen || !r.imagen.startsWith('/images/productos/productos-terminados/')) {
          console.log(`  ❌ URL no se actualizó correctamente`)
          allOk = false
        }
      }
    }
  } catch (e) {
    console.log(`  ❌ No se pudo leer el directorio: ${e.message}`)
    allOk = false
  }

  console.log('\n' + (allOk ? '✅ TEST DE DESCARGA PASÓ' : '❌ TEST DE DESCARGA FALLÓ'))

  // Cleanup
  await rm(TEST_DIR, { recursive: true, force: true })
  process.exit(allOk ? 0 : 1)
}

main().catch(e => {
  console.error('Error fatal:', e)
  process.exit(1)
})
