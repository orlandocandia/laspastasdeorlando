import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

/**
 * POST /api/productos-terminados/fix-bad-coccion
 * One-time fix for products with invalid modo_coccion data.
 * Replaces any modo_coccion that looks like test data with the correct template.
 */
export async function POST(request: NextRequest) {
  // Auth required — use session or secret
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const seedSecret = process.env.SEED_MODO_COCCION_SECRET

  if (secret && seedSecret && secret === seedSecret) {
    // Secret matches — authorized
  } else {
    const auth = await requireAuth()
    if (!auth.authorized) return auth.response!
  }

  try {
    await ensureDbReady()

    const MODO_PASTAS_FRESCAS_AL_HUEVO = `🍝 **Modo de cocción**

**Frescos**
✅ Agua hirviendo con sal.
⏱️ 4-5 minutos.
👨‍🍳 Probar antes de escurrir.

**Freezados**
❄️ Directo al agua hirviendo.
🔄 Separar suavemente el primer minuto.
⏱️ 6-8 minutos.`

    const MODO_PASTAS_FRESCAS_RELLENAS = `🍝 **Modo de cocción**

**Frescos**
✅ Agua hirviendo con sal.
⏱️ 5 minutos.
👨‍🍳 Probar antes de escurrir.

**Freezados**
❄️ Directo al agua hirviendo.
🔄 Separar suavemente el primer minuto.
⏱️ 7 a 9 minutos.`

    function isValidModoCoccion(text: string | null): boolean {
      if (!text) return false
      if (text.length < 30) return false
      if (/^(.)\1{4,}$/.test(text.trim())) return false
      if (!/[🍝🍚🥟🧀🫕🥧✅⏱❄🔥👨🍳🔄💡\*]/.test(text)) return false
      return true
    }

    function getModoForCategory(catName: string): string {
      const cat = catName.toLowerCase()
      if (cat.includes('ñoquis')) return `🍚 **Modo de cocción**

**Frescos**
✅ Agua hirviendo con sal.
⏱️ Hasta que floten (2-3 minutos).
🥄 Retirar con espumadera.

**Freezados**
❄️ Directo al agua hirviendo.
⏱️ Hasta que floten (3-4 minutos).

👨‍🍳 No revolver en exceso.`
      if (cat.includes('sorrentino') || cat.includes('raviol')) return MODO_PASTAS_FRESCAS_RELLENAS
      if (cat.includes('tallarin') || cat.includes('cinta')) return MODO_PASTAS_FRESCAS_AL_HUEVO
      if (cat.includes('tapa')) return `🥟 **Tapas clásicas**

**Fritas:**
🔥 Freír en sartén con abundante aceite caliente.
⏱️ Unos segundos por lado, hasta que estén doradas.

**Al horno:**
✅ Colocar en placa enharinada.
🔥 Horno precalentado medio (180°C).
⏱️ 5-7 minutos.`
      if (cat.includes('empanada')) return `🥟 **Modo de cocción**

**Fritas:**
🔥 Freír en sartén con abundante aceite caliente.
⏱️ Unos minutos hasta dorar.

**Al horno:**
✅ Colocar en placa aceitada.
🔥 Horno precalentado medio (180°C).
⏱️ 15-20 minutos.

❄️ **Freezadas:** Sumar 5-10 minutos al tiempo de cocción.`
      return MODO_PASTAS_FRESCAS_AL_HUEVO
    }

    const products = await db.productoTerminado.findMany({
      select: {
        id: true,
        nombre: true,
        modo_coccion: true,
        categoria: { select: { nombre: true } },
      },
      orderBy: { id: 'asc' },
    })

    let fixed = 0
    const details: string[] = []

    for (const product of products) {
      if (isValidModoCoccion(product.modo_coccion)) continue

      const correctModo = getModoForCategory(product.categoria.nombre)
      await db.productoTerminado.update({
        where: { id: product.id },
        data: { modo_coccion: correctModo },
      })
      details.push(`🔧 ${product.nombre}: replaced "${product.modo_coccion}" → correct template`)
      fixed++
    }

    return NextResponse.json({ success: true, fixed, total: products.length, details })
  } catch (error) {
    console.error('Error fixing modo_coccion:', error)
    return NextResponse.json({ error: 'Error al fixear modo_coccion' }, { status: 500 })
  }
}
