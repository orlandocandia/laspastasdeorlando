/**
 * Seed script: Populate modo_coccion for existing products
 * Run: bun prisma/seed-modo-coccion.ts
 * 
 * This script updates products by name/category with cooking instructions.
 * It's safe to re-run (skips products that already have modo_coccion).
 */

import { PrismaClient } from '@prisma/client'

const MODO_PASTAS_FRESCAS_RELLENAS = `🍝 **Modo de cocción**

**Frescos**
✅ Agua hirviendo con sal.
⏱️ 5 minutos.
👨‍🍳 Probar antes de escurrir.

**Freezados**
❄️ Directo al agua hirviendo.
🔄 Separar suavemente el primer minuto.
⏱️ 7 a 9 minutos.`

const MODO_PASTAS_FRESCAS_AL_HUEVO = `🍝 **Modo de cocción**

**Frescos**
✅ Agua hirviendo con sal.
⏱️ 4-5 minutos.
👨‍🍳 Probar antes de escurrir.

**Freezados**
❄️ Directo al agua hirviendo.
🔄 Separar suavemente el primer minuto.
⏱️ 6-8 minutos.`

const MODO_NOQUIS = `🍚 **Modo de cocción**

**Frescos**
✅ Agua hirviendo con sal.
⏱️ Hasta que floten (2-3 minutos).
🥄 Retirar con espumadera.

**Freezados**
❄️ Directo al agua hirviendo.
⏱️ Hasta que floten (3-4 minutos).

👨‍🍳 No revolver en exceso.`

const MODO_TAPAS_CON_GLUTEN = `🥟 **Tapas clásicas**

**Fritas:**
🔥 Freír en sartén con abundante aceite caliente.
⏱️ Unos segundos por lado, hasta que estén doradas.

**Al horno:**
✅ Colocar en placa enharinada.
🔥 Horno precalentado medio (180°C).
⏱️ 5-7 minutos.`

const MODO_TAPAS_INTEGRAL_SG = `🌾 **Tapas integrales / sin gluten**

**Recomendación:**
✅ Al horno o plancha antiadherente.
🔥 No se recomienda freír.

**Al horno:**
✅ Colocar en placa aceitada.
🔥 180°C por 8-10 minutos.`

const MODO_PASTAS_SECAS = `🍝 **Modo de cocción**

✅ Agua hirviendo con sal.
⏱️ 8-10 minutos.
👨‍🍳 Probar antes de escurrir.

💡 Las pastas secas no necesitan ser descongeladas.`

const MODO_SALSAS = `🫕 **Modo de uso**

✅ Calentar a fuego lento o microondas.
⏱️ 3-5 minutos.

💡 Ideal para acompañar cualquier pasta. También podés saltear la pasta ya cocida directamente en la salsaf.`

const MODO_LASAGNAS_CANELONES = `🧀 **Modo de cocción**

**Lasagnas:**
✅ Llevar a horno precalentado.
🔥 180°C con papel aluminio los primeros 20 min.
⏱️ 30-40 minutos total.
👨‍🍳 Retirar el aluminio los últimos 10 min para gratinar.

**Canelones:**
✅ Colocar en fuente con salsa.
🔥 Horno medio (180°C).
⏱️ 20-25 minutos.

❄️ **Freezados:** Sumar 10-15 minutos al tiempo de cocción.`

const MODO_MASA_EMPANADAS = `🥟 **Tapas para empanadas**

**Fritas:**
🔥 Freír en sartén con abundante aceite caliente.
⏱️ Unos segundos por lado, hasta doradas.

**Al horno:**
✅ Colocar en placa enharinada.
🔥 Horno precalentado medio (180°C).
⏱️ 5-7 minutos.`

// Match product name patterns to modo_coccion
function getModoCoccionForProduct(nombre: string, categoria: string, tipoHarina: string | null): string | null {
  const name = nombre.toLowerCase()
  const cat = categoria.toLowerCase()

  // Ñoquis
  if (cat.includes('ñoquis') || name.includes('ñoqui')) return MODO_NOQUIS

  // Tapas / empanadas
  if (name.includes('masa para empanada') || name.includes('tapas de empanada')) {
    return tipoHarina === 'integral' || tipoHarina === 'sin_gluten' ? MODO_TAPAS_INTEGRAL_SG : MODO_TAPAS_CON_GLUTEN
  }
  if (cat.includes('tapas')) {
    return tipoHarina === 'integral' || tipoHarina === 'sin_gluten' ? MODO_TAPAS_INTEGRAL_SG : MODO_TAPAS_CON_GLUTEN
  }

  // Pastas rellenas (sorrentinos, ravioles, cappelletti, tortellini, agnolottis)
  if (
    name.includes('sorrentino') || name.includes('raviol') || name.includes('cappelletti') ||
    name.includes('tortellini') || name.includes('agnolotti')
  ) return MODO_PASTAS_FRESCAS_RELLENAS

  // Pastas al huevo (fettuccine, tagliatelle, pappardelle, tallarin, cinta)
  if (
    name.includes('fettuccine') || name.includes('tagliatelle') || name.includes('pappardelle') ||
    name.includes('tallarin') || name.includes('cinta ancha')
  ) return MODO_PASTAS_FRESCAS_AL_HUEVO

  // Lasagnas y canelones
  if (cat.includes('lasagna') || cat.includes('canelon') || name.includes('lasagna') || name.includes('canelon')) {
    return MODO_LASAGNAS_CANELONES
  }

  // Pastas secas
  if (cat.includes('secas') || name.includes('spaghetti') || name.includes('penne') || name.includes('tirabuzón') || name.includes('mostachol')) {
    return MODO_PASTAS_SECAS
  }

  // Salsas
  if (cat.includes('salsa')) return MODO_SALSAS

  // Pastas frescas (catch-all for remaining)
  if (cat.includes('frescas')) return MODO_PASTAS_FRESCAS_RELLENAS

  return null
}

async function main() {
  const prisma = new PrismaClient()

  try {
    console.log('🌱 Seeding modo_coccion for existing products...\n')

    const products = await prisma.productoTerminado.findMany({
      select: {
        id: true,
        nombre: true,
        modo_coccion: true,
        tipo_harina: true,
        categoria: { select: { nombre: true } },
      },
      orderBy: { id: 'asc' },
    })

    let updated = 0
    let skipped = 0
    let noMatch = 0

    for (const product of products) {
      if (product.modo_coccion) {
        console.log(`  ⏭️ "${product.nombre}" already has modo_coccion`)
        skipped++
        continue
      }

      const modoCoccion = getModoCoccionForProduct(
        product.nombre,
        product.categoria.nombre,
        product.tipo_harina,
      )

      if (!modoCoccion) {
        console.log(`  ❓ "${product.nombre}" (${product.categoria.nombre}) — no matching modo_coccion`)
        noMatch++
        continue
      }

      await prisma.productoTerminado.update({
        where: { id: product.id },
        data: { modo_coccion: modoCoccion },
      })
      console.log(`  ✅ "${product.nombre}" (${product.categoria.nombre})`)
      updated++
    }

    console.log(`\n✨ Seed completed: ${updated} updated, ${skipped} skipped, ${noMatch} no match`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
