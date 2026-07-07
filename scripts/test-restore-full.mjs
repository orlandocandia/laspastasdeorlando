/**
 * Test end-to-end del flujo completo de recuperación:
 * 1. Crea DB fuente con datos
 * 2. Ejecuta backup (genera .sql.gz local, NO sube a Blob)
 * 3. Simula desastre: borra DB fuente
 * 4. Ejecuta restore: aplica el backup a una DB nueva
 * 5. Verifica que los datos restaurados coinciden con los originales
 *
 * Para simular la descarga desde Vercel Blob sin tener token,
 * este test mockea el módulo @vercel/blob con una implementación
 * que guarda/lee desde un directorio local temporal.
 */
import { createClient } from '@libsql/client'
import { mkdir, rm, writeFile, readFile, copyFile, readdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const TEST_DIR = path.join(PROJECT_ROOT, '.test-restore')
const SRC_DB = path.join(TEST_DIR, 'src.db')
const DST_DB = path.join(TEST_DIR, 'dst.db')
const BLOB_MOCK_DIR = path.join(TEST_DIR, 'blob-mock')

async function main() {
  console.log('🧪 TEST END-TO-END DE RECUPERACIÓN\n')
  console.log('Este test simula un desastre completo y verifica que el restore funciona.\n')

  // Limpieza
  await rm(TEST_DIR, { recursive: true, force: true })
  await mkdir(TEST_DIR, { recursive: true })
  await mkdir(BLOB_MOCK_DIR, { recursive: true })

  // ===== 1. Crear DB fuente con datos críticos =====
  console.log('━'.repeat(60))
  console.log('1️⃣  Creando DB fuente con datos críticos (simula producción)')
  console.log('━'.repeat(60))
  const db = createClient({ url: `file:${SRC_DB}` })
  await db.execute(`CREATE TABLE ProductoTerminado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL,
    imagen TEXT
  )`)
  await db.execute(`CREATE TABLE Usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    nombre TEXT
  )`)
  await db.execute({
    sql: 'INSERT INTO ProductoTerminado (nombre, precio, imagen) VALUES (?, ?, ?)',
    args: ['Sorrentinos de Verdura', 3900, '/images/sorrentinos.png'],
  })
  await db.execute({
    sql: 'INSERT INTO ProductoTerminado (nombre, precio, imagen) VALUES (?, ?, ?)',
    args: ['Ravioles de Espinaca', 4200, null],
  })
  await db.execute({
    sql: 'INSERT INTO Usuario (email, nombre) VALUES (?, ?)',
    args: ['admin@pastasorlando.com', 'Orlando'],
  })

  const origCount = await db.execute('SELECT COUNT(*) as n FROM ProductoTerminado')
  console.log(`  ✅ DB fuente creada: 2 tablas, ${origCount.rows[0].n} productos, 1 usuario\n`)

  // ===== 2. Setup entorno de test =====
  console.log('━'.repeat(60))
  console.log('2️⃣  Configurando entorno de test (mock de Vercel Blob)')
  console.log('━'.repeat(60))
  const testScriptsDir = path.join(TEST_DIR, 'scripts')
  await mkdir(testScriptsDir, { recursive: true })
  await copyFile(
    path.join(PROJECT_ROOT, 'scripts', 'backup-turso.mjs'),
    path.join(testScriptsDir, 'backup-turso.mjs')
  )
  await copyFile(
    path.join(PROJECT_ROOT, 'package.json'),
    path.join(TEST_DIR, 'package.json')
  )
  try { await rm(path.join(TEST_DIR, 'node_modules')) } catch {}
  await execSync(`ln -s ${PROJECT_ROOT}/node_modules ${path.join(TEST_DIR, 'node_modules')}`)

  // Crear mock de @vercel/blob
  const mockBlobDir = path.join(TEST_DIR, 'node_modules', '@vercel', 'blob')
  await mkdir(mockBlobDir, { recursive: true })
  await writeFile(path.join(mockBlobDir, 'package.json'), JSON.stringify({
    name: '@vercel/blob',
    version: '0.0.0-mock',
    main: 'index.mjs',
    type: 'module',
  }))
  await writeFile(path.join(mockBlobDir, 'index.mjs'), `
import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import path from 'path';

const BLOB_DIR = ${JSON.stringify(BLOB_MOCK_DIR)};

// Map: pathname → data URL (base64-encoded) for fetch compatibility
const dataUrlCache = new Map();

export async function put(pathname, data, options) {
  const fullPath = path.join(BLOB_DIR, pathname);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);
  // Create a data: URL that fetch() can handle natively
  const dataUrl = 'data:application/octet-stream;base64,' + Buffer.from(data).toString('base64');
  dataUrlCache.set(pathname, dataUrl);
  return {
    url: dataUrl,
    pathname,
    size: data.length,
    uploadedAt: new Date().toISOString(),
  };
}

export async function list(opts = {}) {
  const prefix = opts.prefix || '';
  const allFiles = [];
  async function walk(dir, base) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      const relPath = base + '/' + e.name;
      if (e.isDirectory()) {
        await walk(fullPath, relPath);
      } else {
        const s = await stat(fullPath);
        const data = await readFile(fullPath);
        const dataUrl = 'data:application/octet-stream;base64,' + Buffer.from(data).toString('base64');
        dataUrlCache.set(relPath.slice(1), dataUrl);
        allFiles.push({
          url: dataUrl,
          pathname: relPath.slice(1),
          size: s.size,
          uploadedAt: s.mtime.toISOString(),
        });
      }
    }
  }
  await walk(BLOB_DIR, '');
  const filtered = prefix ? allFiles.filter(b => b.pathname.startsWith(prefix)) : allFiles;
  filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  return { blobs: filtered, hasMore: false, cursor: undefined };
}

export async function del(url) {
  // mock: no-op
}

export async function head(pathname) {
  return { url: 'mock://blob/' + pathname };
}
`)

  console.log(`  ✅ Mock de @vercel/blob instalado en ${mockBlobDir}\n`)

  // ===== 3. Hacer backup =====
  console.log('━'.repeat(60))
  console.log('3️⃣  Ejecutando backup (dump + upload a Blob mock)')
  console.log('━'.repeat(60))
  const env = {
    ...process.env,
    DATABASE_URL: `file:${SRC_DB}`,
    BLOB_READ_WRITE_TOKEN: 'mock-token',
  }
  execSync('node scripts/backup-turso.mjs --verbose', {
    cwd: TEST_DIR, env, stdio: 'inherit',
  })
  console.log()

  // ===== 4. SIMULAR DESASTRE: borrar DB fuente =====
  console.log('━'.repeat(60))
  console.log('4️⃣  💥 SIMULANDO DESASTRE: eliminando DB fuente')
  console.log('━'.repeat(60))
  await rm(SRC_DB, { force: true })
  console.log(`  ✅ DB fuente eliminada: ${path.basename(SRC_DB)}\n`)

  // ===== 5. Verificar que la DB fuente está vacía =====
  console.log('━'.repeat(60))
  console.log('5️⃣  Verificando pérdida de datos')
  console.log('━'.repeat(60))
  try {
    const check = createClient({ url: `file:${SRC_DB}` })
    await check.execute('SELECT COUNT(*) as n FROM ProductoTerminado')
    console.log('  ❌ La DB fuente todavía existe (no se borró)')
    process.exit(1)
  } catch (e) {
    console.log(`  ✅ Confirmado: la DB fuente no existe (${e.message.split('\n')[0]})\n`)
  }

  // ===== 6. RESTAURAR desde el backup =====
  console.log('━'.repeat(60))
  console.log('6️⃣  ♻️  Restaurando desde backup a nueva DB')
  console.log('━'.repeat(60))
  execSync(`node scripts/backup-turso.mjs restore --to file:${DST_DB} --verbose`, {
    cwd: TEST_DIR, env, stdio: 'inherit',
  })
  console.log()

  // ===== 7. Verificar que los datos restaurados coinciden =====
  console.log('━'.repeat(60))
  console.log('7️⃣  Verificando integridad de datos restaurados')
  console.log('━'.repeat(60))
  const dstDb = createClient({ url: `file:${DST_DB}` })
  const dstCount = await dstDb.execute('SELECT COUNT(*) as n FROM ProductoTerminado')
  const dstProducts = await dstDb.execute('SELECT id, nombre, precio, imagen FROM ProductoTerminado ORDER BY id')
  const dstUsers = await dstDb.execute('SELECT id, email, nombre FROM Usuario ORDER BY id')

  let allOk = true

  if (Number(dstCount.rows[0].n) === 2) {
    console.log(`  ✅ Productos restaurados: ${dstCount.rows[0].n} (esperado 2)`)
  } else {
    console.log(`  ❌ Productos restaurados: ${dstCount.rows[0].n} (esperado 2)`)
    allOk = false
  }

  // Verificar producto 1
  const p1 = dstProducts.rows[0]
  if (p1?.nombre === 'Sorrentinos de Verdura' && Number(p1.precio) === 3900 && p1.imagen === '/images/sorrentinos.png') {
    console.log(`  ✅ Producto #1 restaurado correctamente: ${p1.nombre}`)
  } else {
    console.log(`  ❌ Producto #1 incorrecto: ${JSON.stringify(p1)}`)
    allOk = false
  }

  // Verificar producto 2 (con imagen NULL)
  const p2 = dstProducts.rows[1]
  if (p2?.nombre === 'Ravioles de Espinaca' && Number(p2.precio) === 4200 && p2.imagen === null) {
    console.log(`  ✅ Producto #2 restaurado correctamente (imagen NULL preservada): ${p2.nombre}`)
  } else {
    console.log(`  ❌ Producto #2 incorrecto: ${JSON.stringify(p2)}`)
    allOk = false
  }

  // Verificar usuario
  const u1 = dstUsers.rows[0]
  if (u1?.email === 'admin@pastasorlando.com' && u1.nombre === 'Orlando') {
    console.log(`  ✅ Usuario restaurado correctamente: ${u1.email}`)
  } else {
    console.log(`  ❌ Usuario incorrecto: ${JSON.stringify(u1)}`)
    allOk = false
  }

  // ===== 8. Listar backups disponibles =====
  console.log('\n' + '━'.repeat(60))
  console.log('8️⃣  Listando backups disponibles')
  console.log('━'.repeat(60))
  execSync('node scripts/backup-turso.mjs list', {
    cwd: TEST_DIR, env, stdio: 'inherit',
  })

  // ===== Resumen =====
  console.log('\n' + '━'.repeat(60))
  console.log('📊 RESUMEN DEL TEST DE RECUPERACIÓN')
  console.log('━'.repeat(60))
  console.log(`  Backup:        ✅ generado y subido a Blob (mock)`)
  console.log(`  Desastre:      ✅ DB fuente eliminada`)
  console.log(`  Restore:       ✅ backup aplicado a nueva DB`)
  console.log(`  Integridad:    ${allOk ? '✅ todos los datos restaurados correctamente' : '❌ hay discrepancias'}`)
  console.log('━'.repeat(60))

  // Limpieza
  await rm(TEST_DIR, { recursive: true, force: true })

  console.log(`\n${allOk ? '✅ TEST DE RECUPERACIÓN PASÓ' : '❌ TEST DE RECUPERACIÓN FALLÓ'}`)
  process.exit(allOk ? 0 : 1)
}

main().catch(e => {
  console.error('Error fatal:', e)
  process.exit(1)
})
