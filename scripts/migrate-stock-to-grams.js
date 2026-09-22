// Migration script — converts all MP stock to grams
// Creates a MigrationLog table for backup, then migrates 27 MPs.
// Run with: DATABASE_URL="file:./prisma/dev.db" node scripts/migrate-stock-to-grams.js

const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client')
const db = new PrismaClient()

async function main() {
  console.log('=== INICIO DE MIGRACIÓN DE STOCK A GRAMOS ===\n')

  // Step 1: Create MigrationLog table
  console.log('1. Creando tabla MigrationLog...')
  const libsqlClient = createClient({ url: 'file:./prisma/dev.db' })
  await libsqlClient.execute(`
    CREATE TABLE IF NOT EXISTS "MigrationLog" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "materia_prima_id" INTEGER NOT NULL,
      "nombre_mp" TEXT,
      "unidad_original" TEXT,
      "codigo_unidad_original" TEXT,
      "stock_actual_original" REAL,
      "stock_minimo_original" REAL,
      "fecha" TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  console.log('   Tabla MigrationLog creada.\n')

  // Step 2: Fetch all MPs with their unidad base
  console.log('2. Obteniendo todas las materias primas...')
  const mps = await db.materiaPrima.findMany({ include: { unidadBase: true } })
  console.log(`   ${mps.length} MPs encontradas.\n`)

  // Step 3: Process each MP
  console.log('3. Procesando migración...\n')
  const results = []

  for (const mp of mps) {
    const unitName = mp.unidadBase?.nombre || 'SIN UNIDAD'
    const unitCode = mp.unidadBase?.codigo || '?'
    const originalStock = mp.stock_actual
    const originalMin = mp.stock_minimo

    let newStock, newMin, action

    if (unitCode === 'kg') {
      // Kilogramo → ×1000
      newStock = originalStock * 1000
      newMin = originalMin * 1000
      action = 'kg→g (×1000)'
    } else if (unitCode === 'l') {
      // Litro → ×1000
      newStock = originalStock * 1000
      newMin = originalMin * 1000
      action = 'l→g (×1000)'
    } else if (unitCode === 'g') {
      // Gramo → sin cambio
      newStock = originalStock
      newMin = originalMin
      action = 'g→g (sin cambio)'
    } else if (unitCode === 'ml') {
      // Mililitro → sin cambio
      newStock = originalStock
      newMin = originalMin
      action = 'ml→g (sin cambio)'
    } else if (unitCode === 'u') {
      // Unidad (Huevos) → reset a 0, usuario cargará con compra nueva
      newStock = 0
      newMin = 0
      action = 'u→g (reset a 0, usuario cargará stock real)'
    } else {
      // Unknown unit → skip
      console.log(`   ⚠️  SKIP: ID=${mp.id} | ${mp.nombre} | unidad desconocida: ${unitCode}`)
      results.push({ id: mp.id, nombre: mp.nombre, action: 'SKIP', originalStock, originalMin, newStock: originalStock, newMin: originalMin })
      continue
    }

    // Save to MigrationLog
    await libsqlClient.execute({
      sql: `INSERT INTO "MigrationLog" ("materia_prima_id", "nombre_mp", "unidad_original", "codigo_unidad_original", "stock_actual_original", "stock_minimo_original") VALUES (?, ?, ?, ?, ?, ?)`,
      args: [mp.id, mp.nombre, unitName, unitCode, originalStock, originalMin]
    })

    // Update the MP
    await db.materiaPrima.update({
      where: { id: mp.id },
      data: {
        stock_actual: newStock,
        stock_minimo: newMin,
        id_unidad_base: 2, // Gramo (id=2)
      }
    })

    results.push({ id: mp.id, nombre: mp.nombre, action, originalStock, originalMin, newStock, newMin })
    console.log(`   ✅ ID=${mp.id} | ${mp.nombre} | ${action} | stock: ${originalStock} → ${newStock} | min: ${originalMin} → ${newMin}`)
  }

  // Step 4: Summary
  console.log('\n=== RESUMEN DE MIGRACIÓN ===\n')
  const migrated = results.filter(r => r.action !== 'SKIP')
  const skipped = results.filter(r => r.action === 'SKIP')
  console.log(`Total migradas: ${migrated.length}`)
  console.log(`Total saltadas: ${skipped.length}`)

  const byAction = {}
  migrated.forEach(r => {
    const a = r.action.split(' ')[0]
    if (!byAction[a]) byAction[a] = 0
    byAction[a]++
  })
  console.log('\nPor tipo de conversión:')
  Object.entries(byAction).forEach(([action, count]) => {
    console.log(`  ${action}: ${count} MP(s)`)
  })

  console.log('\n=== VALORES ANTES/DESPUÉS (resumen) ===\n')
  console.log('ID  | Nombre                | Unidad orig | Stock antes → después | Min antes → después')
  console.log('----|-----------------------|-------------|----------------------|---------------------')
  results.forEach(r => {
    console.log(`${String(r.id).padEnd(3)} | ${r.nombre.padEnd(21)} | ${r.action.padEnd(11)} | ${r.originalStock} → ${r.newStock} | ${r.originalMin} → ${r.newMin}`)
  })

  console.log('\n=== CÓMO REVERTIR ===')
  console.log('Si algo sale mal, podés revertir con:')
  console.log('  node scripts/revert-migration.js')
  console.log('O ejecutar manualmente:')
  console.log('  SELECT * FROM "MigrationLog";')
  console.log('  -- Para cada registro, restaurar:')
  console.log('  UPDATE "MateriaPrima" SET stock_actual = <stock_actual_original>, stock_minimo = <stock_minimo_original>, id_unidad_base = <id_original> WHERE id = <materia_prima_id>;')

  console.log('\n=== MIGRACIÓN COMPLETADA ===\n')

  await libsqlClient.close()
  await db.$disconnect()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
