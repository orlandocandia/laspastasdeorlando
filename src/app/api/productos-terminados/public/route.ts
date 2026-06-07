import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/productos-terminados/public - Landing page (público, sin auth)
// Supports pagination via ?limit=12&offset=0
export async function GET(request: NextRequest) {
  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // "con_gluten", "integral", "sin_gluten"
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Cap at 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const where: Record<string, unknown> = {
      visible_en_landing: true,
      estado: true,
    }

    if (tipo && ['con_gluten', 'integral', 'sin_gluten'].includes(tipo)) {
      where.tipo_harina = tipo
    }

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
          categoria: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              imagen: true,
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
