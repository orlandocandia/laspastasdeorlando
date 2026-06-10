import { NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

/**
 * POST /api/productos-terminados/seed-modo-coccion
 * One-time admin endpoint to seed modo_coccion for existing products in Turso.
 * Requires authentication. Idempotent (skips products that already have modo_coccion).
 */
export async function POST() {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    await ensureDbReady()

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

💡 Ideal para acompañar cualquier pasta.`

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

    const MODO_EMPANADAS = `🥟 **Modo de cocción**

**Fritas:**
🔥 Freír en sartén con abundante aceite caliente.
⏱️ Unos minutos hasta dorar.

**Al horno:**
✅ Colocar en placa aceitada.
🔥 Horno precalentado medio (180°C).
⏱️ 15-20 minutos.

❄️ **Freezadas:** Sumar 5-10 minutos al tiempo de cocción.`

    const MODO_TARTAS = `🥧 **Modo de cocción**

✅ Llevar a horno precalentado.
🔥 180°C.
⏱️ 20-30 minutos.

👨‍🍳 Estará lista cuando la masa esté dorada y el relleno caliente.

❄️ **Freezada:** Sumar 10-15 minutos al tiempo de cocción.`

    function getModoCoccionForProduct(nombre: string, categoria: string, tipoHarina: string | null): string | null {
      const name = nombre.toLowerCase()
      const cat = categoria.toLowerCase()

      // Ñoquis
      if (cat.includes('ñoquis') || name.includes('ñoqui')) return MODO_NOQUIS

      // Tapas
      if (cat.includes('tapas') || name.includes('tapas de empanada') || name.includes('masa para empanada')) {
        return tipoHarina === 'integral' || tipoHarina === 'sin_gluten' ? MODO_TAPAS_INTEGRAL_SG : MODO_TAPAS_CON_GLUTEN
      }

      // Empanadas
      if (cat.includes('empanada') || name.includes('empanada')) return MODO_EMPANADAS

      // Tartas
      if (cat.includes('tarta') || name.includes('tarta')) return MODO_TARTAS

      // Pastas rellenas
      if (
        name.includes('sorrentino') || name.includes('raviol') || name.includes('cappelletti') ||
        name.includes('tortellini') || name.includes('agnolotti')
      ) return MODO_PASTAS_FRESCAS_RELLENAS

      // Tallarines / Cintas anchas
      if (name.includes('tallarin') || name.includes('cinta ancha') || name.includes('fettuccine') ||
        name.includes('tagliatelle') || name.includes('pappardelle') || name.includes('spaghetti') ||
        name.includes('ñuder') || name.includes('nuder')
      ) return MODO_PASTAS_FRESCAS_AL_HUEVO

      // Lasagnas y canelones
      if (cat.includes('lasagna') || cat.includes('canelon') || name.includes('lasagna') || name.includes('canelon')) {
        return MODO_LASAGNAS_CANELONES
      }

      // Pastas secas
      if (cat.includes('secas') || name.includes('penne') || name.includes('tirabuzón') || name.includes('mostachol') || name.includes('fideo')) {
        return MODO_PASTAS_SECAS
      }

      // Salsas
      if (cat.includes('salsa')) return MODO_SALSAS

      // Default for fresh pasta
      if (cat.includes('frescas')) return MODO_PASTAS_FRESCAS_RELLENAS

      return null
    }

    const products = await db.productoTerminado.findMany({
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
    const details: string[] = []

    for (const product of products) {
      if (product.modo_coccion) {
        skipped++
        continue
      }

      const modoCoccion = getModoCoccionForProduct(
        product.nombre,
        product.categoria.nombre,
        product.tipo_harina,
      )

      if (!modoCoccion) {
        noMatch++
        details.push(`❓ ${product.nombre} (${product.categoria.nombre})`)
        continue
      }

      await db.productoTerminado.update({
        where: { id: product.id },
        data: { modo_coccion: modoCoccion },
      })
      details.push(`✅ ${product.nombre} (${product.categoria.nombre})`)
      updated++
    }

    return NextResponse.json({
      success: true,
      total: products.length,
      updated,
      skipped,
      noMatch,
      details,
    })
  } catch (error) {
    console.error('Error seeding modo_coccion:', error)
    return NextResponse.json(
      { error: 'Error al sembrar modo_coccion' },
      { status: 500 }
    )
  }
}
