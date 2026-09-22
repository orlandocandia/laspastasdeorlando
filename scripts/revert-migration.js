// Revert migration script — restores original stock values from MigrationLog
// Run with: DATABASE_URL="file:./prisma/dev.db" node scripts/revert-migration.js

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@libsql/client')
const db = new PrismaClient()

async function main() {
  console.log('=== REVERSIÓN DE MIGRACIÓN ===\n')

  const libsqlClient = createClient({ url: 'file:./prisma/dev.db' })

  // Fetch all migration logs
  const result = await libsqlClient.execute('SELECT * FROM "MigrationLog" ORDER BY materia_prima_id')
  console.log(`Registros a revertir: ${result.rows.length}\n`)

  // Map unidad codes back to IDs
  const unitIdMap = {
    'kg': 1, // Kilogramo
    'g': 2,  // Gramo
    'mg': 3, // Miligramo
    'l': 4,  // Litro
    'ml': 5, // Mililitro
    'u': 10, // Unidad
  }

  for (const row of result.rows) {
    const mpId = row.materia_prima_id
    const originalStock = row.stock_actual_original
    const originalMin = row.stock_minimo_original
    const originalCode = row.codigo_unidad_original
    const originalUnitId = unitIdMap[originalCode] || 2

    await db.materiaPrima.update({
      where: { id: mpId },
      data: {
        stock_actual: originalStock,
        stock_minimo: originalMin,
        id_unidad_base: originalUnitId,
      }
    })

    console.log(`  ✅ ID=${mpId} | ${row.nombre_mp} | restaurado: stock=${originalStock} | min=${originalMin} | unidad=${originalCode}`)
  }

  console.log(`\n=== REVERSIÓN COMPLETADA: ${result.rows.length} MPs restauradas ===\n`)

  await libsqlClient.close()
  await db.$disconnect()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
