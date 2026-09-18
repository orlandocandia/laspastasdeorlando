import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/descuentos-volumen
export async function GET(request: NextRequest) {
  try {
    await ensureDbReady()
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    const tipo_item = searchParams.get('tipo_item')

    const where: Record<string, unknown> = {}
    if (activo !== null && activo !== '' && activo !== 'all') where.activo = activo === 'true'
    if (tipo_item) where.tipo_item = tipo_item

    const descuentos = await db.descuentoVolumen.findMany({
      where,
      include: {
        rangos: {
          orderBy: { cantidad_desde: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: descuentos, total: descuentos.length })
  } catch (error) {
    console.error('Error al obtener descuentos por volumen:', error)
    return NextResponse.json({ error: 'Error al obtener descuentos por volumen' }, { status: 500 })
  }
}

// POST /api/descuentos-volumen
export async function POST(request: NextRequest) {
  try {
    await ensureDbReady()
    const body = await request.json()
    const {
      nombre,
      descripcion,
      tipo_item,
      item_id,
      unidad_medida,
      activo,
      fecha_inicio,
      fecha_fin,
      rangos,
    } = body

    if (!nombre || !tipo_item || !unidad_medida) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, tipo_item, unidad_medida' },
        { status: 400 }
      )
    }

    if (!rangos || !Array.isArray(rangos) || rangos.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un rango de descuento' },
        { status: 400 }
      )
    }

    const descuento = await db.descuentoVolumen.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        tipo_item,
        item_id: item_id ?? null,
        unidad_medida,
        activo: activo !== undefined ? activo : true,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        rangos: {
          create: rangos.map((r: {
            cantidad_desde: number
            cantidad_hasta?: number | null
            tipo_descuento: string
            valor: number
            descripcion?: string | null
          }) => ({
            cantidad_desde: parseFloat(String(r.cantidad_desde)),
            cantidad_hasta: r.cantidad_hasta != null ? parseFloat(String(r.cantidad_hasta)) : null,
            tipo_descuento: r.tipo_descuento,
            valor: parseFloat(String(r.valor)),
            descripcion: r.descripcion || null,
          })),
        },
      },
      include: {
        rangos: {
          orderBy: { cantidad_desde: 'asc' },
        },
      },
    })

    return NextResponse.json(descuento, { status: 201 })
  } catch (error) {
    console.error('Error al crear descuento por volumen:', error)
    return NextResponse.json({ error: 'Error al crear descuento por volumen' }, { status: 500 })
  }
}
