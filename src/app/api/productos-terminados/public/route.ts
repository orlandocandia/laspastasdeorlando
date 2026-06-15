import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/productos-terminados/public - Landing page (público, sin auth)
// Supports pagination via ?limit=50&offset=0
// tipo: "con_gluten", "integral", "sin_gluten", or omitted for all products
//
// Products with tipo_harina=null are included in ALL filter results
// (they don't belong to a specific flour type, so they should appear everywhere)
export async function GET(request: NextRequest) {
  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // "con_gluten", "integral", "sin_gluten"
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500) // Generous limit
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const where: Record<string, unknown> = {
      visible_en_landing: true,
      estado: true,
    }

    if (tipo && ['con_gluten', 'integral', 'sin_gluten'].includes(tipo)) {
      // Include products of the requested type PLUS products with tipo_harina=null
      // (null means "not specified" — they should appear in all views)
      where.OR = [
        { tipo_harina: tipo },
        { tipo_harina: null },
      ]
    }
    // If no tipo specified, return all visible products (no tipo_harina filter)

    const [productos, total] = await Promise.all([
      db.productoTerminado.findMany({
        where,
        orderBy: [
          { destacado: 'desc' },
          { orden: 'asc' },
          { nombre: 'asc' },
        ],
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio_venta: true,
          peso_unitario_aprox: true,
          unidades: true,
          imagen: true,
          stock_actual: true,
          destacado: true,
          tipo_harina: true,
          modo_coccion: true,
          texto_frente: true,
          texto_reverso: true,
          categoria: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              seccion: true,
              imagen: true,
              imagen_integral: true,
              imagen_sin_gluten: true,
            },
          },
        },
        take: limit,
        skip: offset,
      }),
      db.productoTerminado.count({ where }),
    ])

    return NextResponse.json({ productos, total, hasMore: offset + productos.length < total })
  } catch (error) {
    console.error('Error al obtener productos públicos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}
