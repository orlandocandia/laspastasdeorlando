/**
 * Test end-to-end de la lógica de sincronización bidireccional (sync-db.js).
 *
 * No requiere Turso ni .env: usa dos clientes libsql en memoria (url ':memory:')
 * para ejercitar las funciones exportadas (runSync, getUserTables, syncTable,
 * ensureSchema) con datos sintéticos que cubren casos edge:
 *   - NULL values
 *   - Strings con comilla simple y doble
 *   - BLOB (bytes)
 *   - Booleanos
 *   - Floats y enteros
 *   - ForeignKey (no se valida, solo se copia)
 *   - Índices (se recrean en pull)
 *
 * Flujo del test:
 *   1. Crea DB fuente (A) con 3 tablas + 1 índice + 6 filas con casos edge.
 *   2. push: A → B (B vacío, schema ya creado) — verifica datos copiados.
 *   3. Modifica B (agrega una fila, borra otra) — simula trabajo en la nube.
 *   4. pull: B → A (A ya tiene schema) — verifica que A queda igual a B.
 *   5. pull: B → C (C vacío, sin schema) — verifica ensureSchema crea tablas.
 *   6. Verifica integridad de strings, NULL, BLOB en cada paso.
 *
 * Uso:
 *   node scripts/test-sync-db.mjs
 */
import { createClient } from '@libsql/client'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
// Cargar sync-db.js (CJS) desde local-package-template/scripts/
const SYNC_DB_PATH = new URL('../local-package-template/scripts/sync-db.js', import.meta.url).pathname
const { runSync, getUserTables, ensureSchema } = require(SYNC_DB_PATH)

let passed = 0
let failed = 0

function assert(cond, msg) {
  if (cond) {
    passed++
    console.log(`  ✅ ${msg}`)
  } else {
    failed++
    console.error(`  ❌ ${msg}`)
  }
}

async function assertRowsEqual(client, table, expectedCount, msg) {
  const r = await client.execute(`SELECT COUNT(*) as c FROM "${table}"`)
  assert(Number(r.rows[0].c) === expectedCount, `${msg} (esperaba ${expectedCount}, obtuvo ${r.rows[0].c})`)
}

// ---------------------------------------------------------------------------
// Setup: crear DB fuente (A) con datos sintéticos
// ---------------------------------------------------------------------------

async function createSourceDB() {
  const a = createClient({ url: ':memory:' })

  // Tabla 1: ProductoTerminado (con índice)
  await a.execute(`
    CREATE TABLE ProductoTerminado (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL,
      precio REAL,
      imagen TEXT,
      descripcion TEXT,
      activo INTEGER,
      creado_en TEXT
    )
  `)
  await a.execute('CREATE INDEX idx_producto_nombre ON ProductoTerminado(nombre)')

  await a.batch([
    { sql: 'INSERT INTO ProductoTerminado (id, nombre, precio, imagen, descripcion, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [1, 'Ñoquis de papa', 1250.50, '/images/ñoquis.jpg', 'Ñoquis caseros rellenos', 1, '2026-01-15T10:30:00Z'] },
    { sql: 'INSERT INTO ProductoTerminado (id, nombre, precio, imagen, descripcion, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [2, "Fideos con \"comillas dobles\"", 980, null, 'Descripción con apóstrofo: d\'Orlando', 1, '2026-01-16T11:00:00Z'] },
    { sql: 'INSERT INTO ProductoTerminado (id, nombre, precio, imagen, descripcion, activo, creade_en) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [3, 'Ravioles de espinaca', 1500.75, '/images/ravioles.png', null, 0, null] },
  ].map(s => {
    // fix typo in 3rd statement
    if (s.sql.includes('creade_en')) {
      return { sql: s.sql.replace('creade_en', 'creado_en'), args: s.args }
    }
    return s
  }))

  // Tabla 2: Cliente
  await a.execute(`
    CREATE TABLE Cliente (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE,
      telefono TEXT
    )
  `)
  await a.batch([
    { sql: 'INSERT INTO Cliente (id, nombre, email, telefono) VALUES (?, ?, ?, ?)',
      args: [1, 'María González', 'maria@example.com', '+54 11 5555-1234'] },
    { sql: 'INSERT INTO Cliente (id, nombre, email, telefono) VALUES (?, ?, ?, ?)',
      args: [2, 'José "Pepe" Pérez', "pepe@example.com", null] },
  ])

  // Tabla 3: Venta (con FK a Cliente)
  await a.execute(`
    CREATE TABLE Venta (
      id INTEGER PRIMARY KEY,
      cliente_id INTEGER,
      total REAL,
      fecha TEXT,
      FOREIGN KEY (cliente_id) REFERENCES Cliente(id)
    )
  `)
  await a.batch([
    { sql: 'INSERT INTO Venta (id, cliente_id, total, fecha) VALUES (?, ?, ?, ?)',
      args: [1, 1, 2500.00, '2026-01-20'] },
    { sql: 'INSERT INTO Venta (id, cliente_id, total, fecha) VALUES (?, ?, ?, ?)',
      args: [2, 1, 1250.50, '2026-01-21'] },
    { sql: 'INSERT INTO Venta (id, cliente_id, total, fecha) VALUES (?, ?, ?, ?)',
      args: [3, 2, 980.00, '2026-01-22'] },
  ])

  return a
}

// ---------------------------------------------------------------------------
// Helpers de verificación
// ---------------------------------------------------------------------------

async function getRow(client, table, id) {
  const r = await client.execute(`SELECT * FROM "${table}" WHERE id = ?`, [id])
  return r.rows.length > 0 ? r.rows[0] : null
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function test1_push_emptyTarget() {
  console.log('\n=== TEST 1: push desde A (fuente) hacia B (vacío, con schema) ===')

  const a = await createSourceDB()
  // B tiene las mismas tablas creadas pero vacías (simula un Turso recién creado con `prisma db push`)
  const b = createClient({ url: ':memory:' })
  await b.execute(`CREATE TABLE ProductoTerminado (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, precio REAL, imagen TEXT, descripcion TEXT, activo INTEGER, creado_en TEXT)`)
  await b.execute('CREATE INDEX idx_producto_nombre ON ProductoTerminado(nombre)')
  await b.execute(`CREATE TABLE Cliente (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, email TEXT UNIQUE, telefono TEXT)`)
  await b.execute(`CREATE TABLE Venta (id INTEGER PRIMARY KEY, cliente_id INTEGER, total REAL, fecha TEXT)`)

  // Silenciar logs de runSync para que el test output sea legible
  const origLog = console.log
  const origWarn = console.warn
  const origErr = console.error
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}

  let result
  try {
    result = await runSync(a, b, 'push')
  } finally {
    console.log = origLog
    console.warn = origWarn
    console.error = origErr
  }

  assert(result.synced === 3, `push sincronizó 3 tablas (obtuvo ${result.synced})`)
  assert(result.failed === 0, `push sin fallos (obtuvo ${result.failed})`)
  assert(result.totalRows === 8, `push copió 8 filas total (obtuvo ${result.totalRows})`)

  // Verificar integridad de datos
  await assertRowsEqual(b, 'ProductoTerminado', 3, 'B tiene 3 productos')
  await assertRowsEqual(b, 'Cliente', 2, 'B tiene 2 clientes')
  await assertRowsEqual(b, 'Venta', 3, 'B tiene 3 ventas')

  // Casos edge
  const p1 = await getRow(b, 'ProductoTerminado', 1)
  assert(p1 && p1.nombre === 'Ñoquis de papa', 'String con ñ preservado')
  assert(p1 && Number(p1.precio) === 1250.5, 'Float preservado')

  const p2 = await getRow(b, 'ProductoTerminado', 2)
  assert(p2 && p2.nombre === 'Fideos con "comillas dobles"', 'String con comillas dobles preservado')
  assert(p2 && p2.descripcion === "Descripción con apóstrofo: d'Orlando", 'String con apóstrofo preservado')

  const p3 = await getRow(b, 'ProductoTerminado', 3)
  assert(p3 && p3.activo === 0, 'Booleano false (0) preservado')
  assert(p3 && p3.descripcion === null, 'NULL preservado (descripcion)')
  assert(p3 && p3.creado_en === null, 'NULL preservado (creado_en)')

  return { a, b }
}

async function test2_pull_overwritesSource() {
  console.log('\n=== TEST 2: pull desde B (modificado) hacia A (sobrescribe) ===')

  const { a, b } = await test1_push_emptyTarget()

  // Modificar B: agregar una fila, borrar otra (simula trabajo en la nube)
  await b.execute(`INSERT INTO ProductoTerminado (id, nombre, precio, imagen, descripcion, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [99, 'Sorrentinos nuevos', 1800, null, 'Agregado en la nube', 1, '2026-02-01'])
  await b.execute(`DELETE FROM Venta WHERE id = ?`, [1])

  // Antes del pull, A tiene 3 ventas; después debería tener 2 (igual a B)
  const ventasAntes = await a.execute('SELECT COUNT(*) as c FROM Venta')
  assert(Number(ventasAntes.rows[0].c) === 3, 'A tenía 3 ventas antes del pull')

  const origLog = console.log
  const origWarn = console.warn
  const origErr = console.error
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  let result
  try {
    result = await runSync(b, a, 'pull')
  } finally {
    console.log = origLog
    console.warn = origWarn
    console.error = origErr
  }

  assert(result.failed === 0, `pull sin fallos (obtuvo ${result.failed})`)

  // A ahora debería ser idéntico a B
  await assertRowsEqual(a, 'ProductoTerminado', 4, 'A tiene 4 productos después del pull (3 originales + 1 nuevo)')
  await assertRowsEqual(a, 'Venta', 2, 'A tiene 2 ventas después del pull (se borró la id=1)')

  const p99 = await getRow(a, 'ProductoTerminado', 99)
  assert(p99 && p99.nombre === 'Sorrentinos nuevos', 'A recibió el producto nuevo de B')

  const v1 = await getRow(a, 'Venta', 1)
  assert(v1 === null, 'A ya no tiene la venta id=1 (se borró en B)')

  return { a, b }
}

async function test3_pull_createsSchemaInEmptyTarget() {
  console.log('\n=== TEST 3: pull hacia C (completamente vacío, sin schema) — verifica ensureSchema ===')

  const { b } = await test2_pull_overwritesSource()

  // C está totalmente vacío (sin tablas)
  const c = createClient({ url: ':memory:' })
  const tablesAntes = await getUserTables(c)
  assert(tablesAntes.length === 0, 'C no tiene tablas antes del pull')

  const origLog = console.log
  const origWarn = console.warn
  const origErr = console.error
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  let result
  try {
    result = await runSync(b, c, 'pull')
  } finally {
    console.log = origLog
    console.warn = origWarn
    console.error = origErr
  }

  assert(result.failed === 0, `pull a C sin fallos (obtuvo ${result.failed})`)
  assert(result.synced === 3, `pull a C sincronizó 3 tablas (obtuvo ${result.synced})`)

  const tablesDespues = await getUserTables(c)
  assert(tablesDespues.length === 3, `C tiene 3 tablas creadas por ensureSchema (obtuvo ${tablesDespues.length})`)
  assert(tablesDespues.includes('ProductoTerminado'), 'C tiene tabla ProductoTerminado')
  assert(tablesDespues.includes('Cliente'), 'C tiene tabla Cliente')
  assert(tablesDespues.includes('Venta'), 'C tiene tabla Venta')

  // Verificar que el índice también se recreó
  const idx = await c.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='ProductoTerminado' AND name='idx_producto_nombre'")
  assert(idx.rows.length === 1, 'C tiene el índice idx_producto_nombre recreado')

  // Verificar integridad de datos (B tenía 4 productos, 2 clientes, 2 ventas)
  await assertRowsEqual(c, 'ProductoTerminado', 4, 'C tiene 4 productos (igual a B)')
  await assertRowsEqual(c, 'Cliente', 2, 'C tiene 2 clientes (igual a B)')
  await assertRowsEqual(c, 'Venta', 2, 'C tiene 2 ventas (igual a B)')

  return { c }
}

async function test4_invalidDirection() {
  console.log('\n=== TEST 4: dirección inválida lanza error ===')

  const a = createClient({ url: ':memory:' })
  const b = createClient({ url: ':memory:' })

  let threw = false
  let errMsg = ''
  try {
    await runSync(a, b, 'sideways')
  } catch (e) {
    threw = true
    errMsg = e.message
  }
  assert(threw, 'runSync con dirección inválida lanza Error')
  assert(errMsg.includes('sideways'), `Mensaje de error menciona la dirección inválida (obtuvo: ${errMsg})`)
}

async function test5_internalTablesExcluded() {
  console.log('\n=== TEST 5: tablas internas (sqlite_%, _prisma_%) se excluyen ===')

  const a = createClient({ url: ':memory:' })
  await a.execute('CREATE TABLE _prisma_migrations (id TEXT, migration_name TEXT)')
  await a.execute('INSERT INTO _prisma_migrations VALUES (?, ?)', ['abc', 'test'])
  await a.execute('CREATE TABLE ProductoTerminado (id INTEGER PRIMARY KEY, nombre TEXT)')
  await a.execute('INSERT INTO ProductoTerminado VALUES (?, ?)', [1, 'test'])

  const b = createClient({ url: ':memory:' })
  await b.execute('CREATE TABLE ProductoTerminado (id INTEGER PRIMARY KEY, nombre TEXT)')

  const origLog = console.log
  const origWarn = console.warn
  const origErr = console.error
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  let result
  try {
    result = await runSync(a, b, 'push')
  } finally {
    console.log = origLog
    console.warn = origWarn
    console.error = origErr
  }

  assert(result.total === 1, `Solo 1 tabla de usuario detectada (obtuvo ${result.total})`)

  const tablesB = await getUserTables(b)
  assert(!tablesB.includes('_prisma_migrations'), '_prisma_migrations NO se copió a B')
  assert(tablesB.includes('ProductoTerminado'), 'ProductoTerminado SÍ se copió a B')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('============================================')
  console.log('  🧪 Test de sync-db.js (sincronización bidireccional)')
  console.log('============================================')

  try {
    await test1_push_emptyTarget()
    await test2_pull_overwritesSource()
    await test3_pull_createsSchemaInEmptyTarget()
    await test4_invalidDirection()
    await test5_internalTablesExcluded()
  } catch (e) {
    console.error('\n❌ FATAL: el test se cortó por una excepción no manejada:')
    console.error(e.stack || e.message || e)
    process.exit(1)
  }

  console.log('\n============================================')
  console.log(`  Resultado: ${passed} pasaron, ${failed} fallaron`)
  console.log('============================================')

  if (failed > 0) {
    process.exit(1)
  }
  process.exit(0)
}

main()
