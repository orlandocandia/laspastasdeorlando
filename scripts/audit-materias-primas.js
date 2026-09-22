// Audit script — read-only, no modifications
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const mps = await db.materiaPrima.findMany({ include: { unidadBase: true } })
  console.log('=== TOTAL MPs:', mps.length, '===')

  // Group by unidad base
  const byUnit = {}
  mps.forEach(mp => {
    const unitName = mp.unidadBase?.nombre || 'SIN UNIDAD'
    if (!byUnit[unitName]) byUnit[unitName] = { count: 0, mps: [] }
    byUnit[unitName].count++
    byUnit[unitName].mps.push({ id: mp.id, nombre: mp.nombre, codigo: mp.codigo, stock: mp.stock_actual, min: mp.stock_minimo })
  })

  console.log('\n=== RESUMEN POR UNIDAD BASE ===')
  Object.entries(byUnit).forEach(([unit, data]) => {
    console.log(`${unit}: ${data.count} MP(s)`)
  })

  console.log('\n=== DETALLE: MPs NO en gramos (candidatas a migrar) ===')
  const notGrams = mps.filter(mp => mp.unidadBase?.codigo !== 'g')
  if (notGrams.length === 0) {
    console.log('  (ninguna — todas están en gramos)')
  } else {
    notGrams.forEach(mp => {
      console.log(`  ID=${mp.id} | ${mp.nombre} | unidad=${mp.unidadBase?.nombre || 'SIN'} (${mp.unidadBase?.codigo || '?'}) | stock=${mp.stock_actual} | min=${mp.stock_minimo}`)
    })
  }

  console.log('\n=== LISTADO COMPLETO ===')
  mps.forEach(mp => {
    console.log(`  ID=${mp.id} | ${mp.nombre} | unidad=${mp.unidadBase?.nombre || 'SIN'} (${mp.unidadBase?.codigo || '?'}) | stock=${mp.stock_actual} | min=${mp.stock_minimo}`)
  })

  await db.$disconnect()
}

main().catch(e => { console.error(e.message); process.exit(1) })
