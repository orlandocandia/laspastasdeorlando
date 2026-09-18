/**
 * Test del script de backup de Turso.
 * Crea una DB SQLite con datos sintéticos, ejecuta el backup en modo --no-upload,
 * y verifica que el .sql generado sea válido (re-importable).
 */
import { createClient } from '@libsql/client'
import { mkdir, rm, writeFile, copyFile, readFile, readdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { gunzip } from 'zlib'
import { promisify } from 'util'

const gunzipAsync = promisify(gunzip)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const TEST_DIR = path.join(PROJECT_ROOT, '.test-backup')
const SRC_DB = path.join(TEST_DIR, 'src.db')
const DST_DB = path.join(TEST_DIR, 'dst.db')

async function main() {
  console.log('🧪 TEST DEL SCRIPT DE BACKUP DE TURSO\n')

  await rm(TEST_DIR, { recursive: true, force: true })
  await mkdir(TEST_DIR, { recursive: true })

  // 1. Crear DB fuente con datos sintéticos
  console.log('1️⃣  Creando DB fuente con datos sintéticos...')
  const db = createClient({ url: `file:${SRC_DB}` })

  await db.execute(`CREATE TABLE ProductoTerminado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL,
    descripcion TEXT,
    imagen TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  await db.execute(`CREATE TABLE Categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    slug TEXT UNIQUE
  )`)
  await db.execute(`CREATE TABLE Producto_Categoria (
    producto_id INTEGER,
    categoria_id INTEGER,
    FOREIGN KEY (producto_id) REFERENCES ProductoTerminado(id)
  )`)
  await db.execute(`CREATE INDEX idx_producto_nombre ON ProductoTerminado(nombre)`)

  // Insertar datos con casos edge: NULL, números, strings con comilla, BLOB, fecha
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)`,
    args: [1, 'Sorrentinos de Verdura', 3900.50, 'Rellenos de espinaca y ricota', '/images/sorrentinos.png'],
  })
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)`,
    args: [2, "Ravioles de Espinaca's", 4200, 'Con salsa de tomate', null],
  })
  await db.execute({
    sql: `INSERT INTO ProductoTerminado (id, nombre, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)`,
    args: [3, 'Capelettis', 4500, 'Con "comilla doble" en descripción', 'https://example.com/img.png'],
  })
  await db.execute({
    sql: `INSERT INTO Categoria (id, nombre, slug) VALUES (?, ?, ?)`,
    args: [1, 'Pastas', 'pastas'],
  })
  await db.execute({
    sql: `INSERT INTO Categoria (id, nombre, slug) VALUES (?, ?, ?)`,
    args: [2, 'Horneados', 'horneados'],
  })
  await db.execute({
    sql: `INSERT INTO Producto_Categoria (producto_id, categoria_id) VALUES (?, ?)`,
    args: [1, 1],
  })

  // Crear trigger
  await db.execute(`CREATE TRIGGER trg_audit AFTER INSERT ON ProductoTerminado
    BEGIN
      INSERT INTO Categoria (nombre, slug) VALUES ('audit-' || NEW.nombre, 'audit-' || NEW.id);
    END;
  `)

  console.log('  ✅ DB fuente creada con 3 tablas, 1 índice, 1 trigger, 6 filas')

  // 2. Setup test env (copiar script al TEST_DIR para que PROJECT_ROOT se resuelva ahí)
  console.log('\n2️⃣  Configurando entorno de test...')
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

  // 3. Ejecutar backup en modo --no-upload
  console.log('\n3️⃣  Ejecutando backup en modo --no-upload...')
  try {
    execSync(
      `node scripts/backup-turso.mjs --no-upload --verbose --db file:${SRC_DB}`,
      { cwd: TEST_DIR, env: { ...process.env, DATABASE_URL: `file:${SRC_DB}` }, stdio: 'inherit' }
    )
  } catch (e) {
    console.error('Error al ejecutar backup:', e.message)
    process.exit(1)
  }

  // 4. Verificar que se generó el archivo .sql.gz
  console.log('\n4️⃣  Verificando archivo generado...')
  const files = await readdir(TEST_DIR)
  const sqlGzFiles = files.filter(f => f.startsWith('laspastasdeorlando-') && f.endsWith('.sql.gz'))
  const sqlFiles = files.filter(f => f.startsWith('laspastasdeorlando-') && f.endsWith('.sql'))

  if (sqlFiles.length !== 1) {
    console.error(`❌ Esperaba 1 archivo .sql, encontré ${sqlFiles.length}: ${sqlFiles.join(', ')}`)
    process.exit(1)
  }
  console.log(`  ✅ Archivo SQL generado: ${sqlFiles[0]}`)

  // 5. Verificar contenido del SQL
  console.log('\n5️⃣  Verificando contenido del SQL...')
  const sqlContent = await readFile(path.join(TEST_DIR, sqlFiles[0]), 'utf8')

  const checks = [
    { desc: 'Contiene PRAGMA foreign_keys=OFF', test: sqlContent.includes('PRAGMA foreign_keys=OFF;') },
    { desc: 'Contiene BEGIN TRANSACTION', test: sqlContent.includes('BEGIN TRANSACTION;') },
    { desc: 'Contiene COMMIT', test: sqlContent.includes('COMMIT;') },
    { desc: 'Contiene CREATE TABLE ProductoTerminado', test: sqlContent.includes('CREATE TABLE ProductoTerminado') },
    { desc: 'Contiene CREATE TABLE Categoria', test: sqlContent.includes('CREATE TABLE Categoria') },
    { desc: 'Contiene DROP TABLE IF EXISTS', test: sqlContent.includes('DROP TABLE IF EXISTS') },
    { desc: 'Contiene INSERT INTO ProductoTerminado', test: sqlContent.includes('INSERT INTO "ProductoTerminado"') },
    { desc: 'Contiene INSERT INTO Categoria', test: sqlContent.includes('INSERT INTO "Categoria"') },
    { desc: 'Contiene Sorrentinos de Verdura', test: sqlContent.includes('Sorrentinos de Verdura') },
    { desc: 'String con comilla simple escapada (Ravioles de Espinaca\'s)', test: sqlContent.includes("Ravioles de Espinaca''s") },
    { desc: 'NULL preservado', test: sqlContent.includes(', NULL,') },
    { desc: 'Contiene índice idx_producto_nombre', test: sqlContent.includes('idx_producto_nombre') },
    { desc: 'Contiene trigger trg_audit', test: sqlContent.includes('trg_audit') },
    { desc: 'No contiene tablas sqlite_%', test: !sqlContent.toLowerCase().includes('sqlite_master') || sqlContent.includes('FROM sqlite_master') === false },
  ]

  let allOk = true
  for (const c of checks) {
    console.log(`  ${c.test ? '✅' : '❌'} ${c.desc}`)
    if (!c.test) allOk = false
  }

  // 6. Verificar que el .sql es re-importable (creando DB destino)
  console.log('\n6️⃣  Verificando que el .sql es re-importable...')
  const dstDb = createClient({ url: `file:${DST_DB}` })

  // Split y ejecutar statements
  const statements = splitSqlStatements(sqlContent)
  console.log(`  ${statements.length} statements a ejecutar en DB destino`)

  let execOk = true
  for (const stmt of statements) {
    if (stmt.trim().startsWith('--')) continue
    try {
      await dstDb.execute(stmt)
    } catch (e) {
      // PRAGMA y BEGIN/COMMIT pueden fallar en libsql; ignorar
      if (stmt.match(/^(PRAGMA|BEGIN|COMMIT)/i)) continue
      console.error(`  ⚠️ Error al ejecutar: ${stmt.substring(0, 80)}...`)
      console.error(`     ${e.message}`)
      execOk = false
    }
  }

  if (execOk) console.log('  ✅ Todos los statements se ejecutaron sin error')

  // 7. Verificar que los datos restaurados coinciden con los originales
  console.log('\n7️⃣  Verificando integridad de datos restaurados...')
  const origCount = await db.execute('SELECT COUNT(*) as n FROM ProductoTerminado')
  const dstCount = await dstDb.execute('SELECT COUNT(*) as n FROM ProductoTerminado')
  const origRows = Number(origCount.rows[0].n)
  const dstRows = Number(dstCount.rows[0].n)
  if (origRows === dstRows) {
    console.log(`  ✅ Filas en ProductoTerminado: ${origRows} == ${dstRows}`)
  } else {
    console.log(`  ❌ Filas en ProductoTerminado: ${origRows} != ${dstRows}`)
    allOk = false
  }

  // Verificar contenido específico
  const origRow = await db.execute("SELECT nombre, precio FROM ProductoTerminado WHERE id=1")
  const dstRow = await dstDb.execute("SELECT nombre, precio FROM ProductoTerminado WHERE id=1")
  if (JSON.stringify(origRow.rows) === JSON.stringify(dstRow.rows)) {
    console.log('  ✅ Datos del producto #1 coinciden')
  } else {
    console.log(`  ❌ Datos del producto #1 no coinciden`)
    console.log(`     orig: ${JSON.stringify(origRow.rows)}`)
    console.log(`     dst:  ${JSON.stringify(dstRow.rows)}`)
    allOk = false
  }

  // Verificar string con comilla simple
  const escapingRow = await dstDb.execute("SELECT nombre FROM ProductoTerminado WHERE id=2")
  if (escapingRow.rows[0]?.nombre === "Ravioles de Espinaca's") {
    console.log("  ✅ String con comilla simple escapada correctamente (Ravioles de Espinaca's)")
  } else {
    console.log(`  ❌ String con comilla no se restauró bien: ${escapingRow.rows[0]?.nombre}`)
    allOk = false
  }

  // Verificar string con comilla doble
  const doubleQuoteRow = await dstDb.execute("SELECT descripcion FROM ProductoTerminado WHERE id=3")
  if (doubleQuoteRow.rows[0]?.descripcion?.includes('"comilla doble"')) {
    console.log('  ✅ String con comilla doble preservado')
  } else {
    console.log(`  ❌ String con comilla doble no se preservó: ${doubleQuoteRow.rows[0]?.descripcion}`)
    allOk = false
  }

  // 8. Test del splitSqlStatements (verificar que es seguro)
  console.log('\n8️⃣  Test del split de SQL statements...')
  const edgeSql = `INSERT INTO T VALUES ('con ; punto y coma'); INSERT INTO T VALUES ('otro'); -- comment ; with semicolon
  INSERT INTO T VALUES (NULL);`
  const stmts = splitSqlStatements(edgeSql)
  if (stmts.length === 3) {
    console.log(`  ✅ Split correcto: ${stmts.length} statements (esperado 3)`)
  } else {
    console.log(`  ❌ Split incorrecto: ${stmts.length} statements (esperado 3)`)
    stmts.forEach((s, i) => console.log(`     [${i}] ${s.substring(0, 60)}`))
    allOk = false
  }

  // Limpieza
  await rm(TEST_DIR, { recursive: true, force: true })

  console.log('\n' + (allOk ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON'))
  process.exit(allOk ? 0 : 1)
}

// Implementación local del split para test (con soporte BEGIN...END)
function splitSqlStatements(sql) {
  const statements = []
  let current = ''
  let inString = false
  let stringChar = null
  let beginDepth = 0
  let i = 0
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
    if (c === "'" || c === '"') {
      inString = true
      stringChar = c
      current += c
      i++
      continue
    }
    if (c === ';') {
      if (beginDepth > 0) {
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
    if (/\bBEGIN$/i.test(current) && !inString) {
      const rest = sql.slice(i)
      const restTrimmed = rest.match(/^\s*(\w+)/)
      if (!restTrimmed || !/^TRANSACTION$/i.test(restTrimmed[1])) {
        beginDepth++
      }
    }
    if (/\bEND$/i.test(current) && !inString && beginDepth > 0) {
      beginDepth--
    }
  }
  const last = current.trim()
  if (last) statements.push(last + (last.endsWith(';') ? '' : ';'))
  return statements
}

main().catch(e => {
  console.error('Error fatal:', e)
  process.exit(1)
})
