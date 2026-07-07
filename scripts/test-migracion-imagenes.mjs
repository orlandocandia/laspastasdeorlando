/**
 * Test del script de migración de imágenes.
 * Crea una DB SQLite temporal con URLs externas simuladas,
 * ejecuta el script, y verifica que las URLs se convirtieron correctamente.
 */
import { createClient } from '@libsql/client'
import { mkdir, rm, writeFile, copyFile, readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const TEST_DIR = path.join(PROJECT_ROOT, '.test-migracion')
const TEST_DB_PATH = path.join(TEST_DIR, 'test.db')
const TEST_PUBLIC = path.join(TEST_DIR, 'public')

async function main() {
  console.log('🧪 TEST DEL SCRIPT DE MIGRACIÓN DE IMÁGENES\n')

  // Limpiar test dir previo
  await rm(TEST_DIR, { recursive: true, force: true })
  await mkdir(TEST_DIR, { recursive: true })
  await mkdir(path.join(TEST_PUBLIC, 'images', 'uploads', 'productos-terminados'), { recursive: true })

  // Crear DB de prueba con datos sintéticos
  console.log('1️⃣  Creando DB de prueba con URLs externas sintéticas...')
  const db = createClient({ url: `file:${TEST_DB_PATH}` })

  // Crear tablas
  await db.execute(`
    CREATE TABLE ProductoTerminado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      imagen TEXT
    )
  `)
  await db.execute(`
    CREATE TABLE CategoriaProductoTerminado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      imagen TEXT,
      imagen_integral TEXT,
      imagen_sin_gluten TEXT
    )
  `)

  // Insertar filas con distintos tipos de URL
  // 1. URL de Vercel dado de baja (debe convertirse a /images/...)
  // 2. URL externa cualquiera (debe intentar descargar — fallará si no hay internet)
  // 3. URL de Vercel Blob (debe intentar descargar)
  // 4. URL local ya correcta (no debe tocarse)
  // 5. URL NULL (no debe tocarse)
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, imagen) VALUES (?, ?, ?)`,
    args: [1, 'Sorrentinos de Verdura', 'https://laspastasdeorlando.vercel.app/images/uploads/productos-terminados/abc-123.png'],
  })
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, imagen) VALUES (?, ?, ?)`,
    args: [2, 'Ravioles de Espinaca', 'https://example.com/images/ravioles.png'],
  })
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, imagen) VALUES (?, ?, ?)`,
    args: [3, 'Capelettis de Pollo', 'https://laspastasdeorlando.vercel.app/images/uploads/productos-terminados/test-local.png'],
  })
  // Crear el archivo localmente para simular que ya existe
  await writeFile(path.join(TEST_PUBLIC, 'images', 'uploads', 'productos-terminados', 'test-local.png'), Buffer.from('fake-png'))

  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, imagen) VALUES (?, ?, ?)`,
    args: [4, 'Producto Sin Imagen', null],
  })
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, imagen) VALUES (?, ?, ?)`,
    args: [5, 'Producto Con Ruta Local', '/images/productos/productos-terminados/5-producto.png'],
  })

  // Categoria con 3 columnas de imagen
  await db.execute({
    sql: `INSERT INTO CategoriaProductoTerminado (id, nombre, imagen, imagen_integral, imagen_sin_gluten) VALUES (?, ?, ?, ?, ?)`,
    args: [1, 'Pastas', 'https://laspastasdeorlando.vercel.app/images/uploads/categorias/pastas.png', null, null],
  })

  // Listar antes
  console.log('\n2️⃣  Estado ANTES de la migración:')
  const before = await db.execute('SELECT id, nombre, imagen FROM ProductoTerminado ORDER BY id')
  for (const r of before.rows) {
    console.log(`  PT#${r.id} ${r.nombre}: ${r.imagen || '(null)'}`)
  }
  const beforeCat = await db.execute('SELECT id, nombre, imagen, imagen_integral, imagen_sin_gluten FROM CategoriaProductoTerminado ORDER BY id')
  for (const r of beforeCat.rows) {
    console.log(`  CAT#${r.id} ${r.nombre}: imagen=${r.imagen || '(null)'}, integral=${r.imagen_integral || '(null)'}, sin_gluten=${r.imagen_sin_gluten || '(null)'}`)
  }

  // Ejecutar el script en modo --no-download (solo convertir rutas, no descargar)
  // Apuntando PROJECT_ROOT al TEST_DIR para no tocar el public real
  console.log('\n3️⃣  Ejecutando script de migración en modo --no-download...')
  try {
    const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'migrar-imagenes-a-local.mjs')
    // Copiar el script al TEST_DIR para que PROJECT_ROOT se resuelva a TEST_DIR
    const testScriptsDir = path.join(TEST_DIR, 'scripts')
    await mkdir(testScriptsDir, { recursive: true })
    await copyFile(scriptPath, path.join(testScriptsDir, 'migrar-imagenes-a-local.mjs'))
    // Copiar package.json y node_modules para que @libsql/client resuelva
    await copyFile(path.join(PROJECT_ROOT, 'package.json'), path.join(TEST_DIR, 'package.json'))
    // Crear symlink a node_modules
    try { await rm(path.join(TEST_DIR, 'node_modules')) } catch {}
    await execSync(`ln -s ${PROJECT_ROOT}/node_modules ${path.join(TEST_DIR, 'node_modules')}`)

    // Crear .env para que DATABASE_URL apunte a test.db
    await writeFile(path.join(TEST_DIR, '.env'), `DATABASE_URL=file:${TEST_DB_PATH}\n`)

    // Ejecutar
    const env = {
      ...process.env,
      DATABASE_URL: `file:${TEST_DB_PATH}`,
    }
    execSync(`node scripts/migrar-imagenes-a-local.mjs --no-download`, {
      cwd: TEST_DIR,
      env,
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('Error al ejecutar el script:', e.message)
    process.exit(1)
  }

  // Verificar resultados
  console.log('\n4️⃣  Estado DESPUÉS de la migración:')
  const after = await db.execute('SELECT id, nombre, imagen FROM ProductoTerminado ORDER BY id')
  let allOk = true
  for (const r of after.rows) {
    console.log(`  PT#${r.id} ${r.nombre}: ${r.imagen || '(null)'}`)
  }
  const afterCat = await db.execute('SELECT id, nombre, imagen, imagen_integral, imagen_sin_gluten FROM CategoriaProductoTerminado ORDER BY id')
  for (const r of afterCat.rows) {
    console.log(`  CAT#${r.id} ${r.nombre}: imagen=${r.imagen || '(null)'}, integral=${r.imagen_integral || '(null)'}, sin_gluten=${r.imagen_sin_gluten || '(null)'}`)
  }

  // Verificar expectativas
  console.log('\n5️⃣  Verificando expectativas:')
  const checks = [
    { id: 1, expected: '/images/uploads/productos-terminados/abc-123.png', desc: 'PT#1 URL Vercel dado de baja → convertir a ruta local' },
    { id: 3, expected: '/images/uploads/productos-terminados/test-local.png', desc: 'PT#3 URL Vercel cuyo archivo existe localmente → convertir a ruta local' },
    { id: 4, expected: null, desc: 'PT#4 imagen NULL → no tocar' },
    { id: 5, expected: '/images/productos/productos-terminados/5-producto.png', desc: 'PT#5 ya ruta local → no tocar' },
  ]
  for (const c of checks) {
    const row = after.rows.find(r => r.id === c.id)
    const actual = row?.imagen ?? null
    const ok = actual === c.expected
    console.log(`  ${ok ? '✅' : '❌'} ${c.desc}`)
    console.log(`     esperado: ${c.expected}`)
    console.log(`     actual:   ${actual}`)
    if (!ok) allOk = false
  }

  // Verificar backup
  console.log('\n6️⃣  Verificando backup creado:')
  const fs = await import('fs/promises')
  const dirContents = await fs.readdir(TEST_DIR)
  const backups = dirContents.filter(f => f.startsWith('test.db.backup-'))
  if (backups.length === 1) {
    console.log(`  ✅ Backup creado: ${backups[0]}`)
  } else {
    console.log(`  ❌ Esperaba 1 backup, encontré ${backups.length}: ${backups.join(', ')}`)
    allOk = false
  }

  // PT#2 (URL externa con --no-download) debería quedar igual (no se pudo descargar ni convertir)
  const pt2 = after.rows.find(r => r.id === 2)
  if (pt2?.imagen === 'https://example.com/images/ravioles.png') {
    console.log('  ✅ PT#2 URL externa no convertible se dejó igual (esperado con --no-download)')
  } else {
    console.log(`  ❌ PT#2 debería mantener URL externa, actual: ${pt2?.imagen}`)
    allOk = false
  }

  // CAT#1 debería tener imagen convertida
  const cat1 = afterCat.rows[0]
  if (cat1?.imagen === '/images/uploads/categorias/pastas.png') {
    console.log('  ✅ CAT#1 imagen convertida a ruta local')
  } else {
    console.log(`  ❌ CAT#1 imagen debería ser /images/uploads/categorias/pastas.png, actual: ${cat1?.imagen}`)
    allOk = false
  }

  console.log('\n' + (allOk ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON'))

  // Limpieza
  await rm(TEST_DIR, { recursive: true, force: true })
  process.exit(allOk ? 0 : 1)
}

main().catch(e => {
  console.error('Error fatal:', e)
  process.exit(1)
})
