import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/productos-terminados/public - Landing page (público, sin auth)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // "con_gluten", "integral", "sin_gluten"

    const where: Record<string, unknown> = {
      visible_en_landing: true,
      estado: true,
    }

    if (tipo && ['con_gluten', 'integral', 'sin_gluten'].includes(tipo)) {
      where.tipo_harina = tipo
    }

    const productos = await db.productoTerminado.findMany({
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
    })

    return NextResponse.json({ productos })
  } catch (error) {
    console.error('Error al obtener productos públicos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}
