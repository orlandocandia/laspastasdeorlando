import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/descuentos-volumen/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbReady()
    const { id } = await params
    const descuento = await db.descuentoVolumen.findUnique({
      where: { id: parseInt(id) },
      include: {
        rangos: {
          orderBy: { cantidad_desde: 'asc' },
        },
      },
    })

    if (!descuento) {
      return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 })
    }

    return NextResponse.json(descuento)
  } catch (error) {
    console.error('Error al obtener descuento por volumen:', error)
    return NextResponse.json({ error: 'Error al obtener descuento por volumen' }, { status: 500 })
  }
}

// PUT /api/descuentos-volumen/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbReady()
    const { id } = await params
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

    const parsedId = parseInt(id)

    // Verify the descuento exists
    const existing = await db.descuentoVolumen.findUnique({ where: { id: parsedId } })
    if (!existing) {
      return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 })
    }

    // If rangos array provided, replace all existing rangos
    if (rangos !== undefined) {
      await db.descuentoVolumenRango.deleteMany({
        where: { id_descuento: parsedId },
      })

      if (Array.isArray(rangos) && rangos.length > 0) {
        await db.descuentoVolumenRango.createMany({
          data: rangos.map((r: {
            cantidad_desde: number
            cantidad_hasta?: number | null
            tipo_descuento: string
            valor: number
            descripcion?: string | null
          }) => ({
            id_descuento: parsedId,
            cantidad_desde: parseFloat(String(r.cantidad_desde)),
            cantidad_hasta: r.cantidad_hasta != null ? parseFloat(String(r.cantidad_hasta)) : null,
            tipo_descuento: r.tipo_descuento,
            valor: parseFloat(String(r.valor)),
            descripcion: r.descripcion || null,
          })),
        })
      }
    }

    // Build update data only for provided fields
    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (tipo_item !== undefined) updateData.tipo_item = tipo_item
    if (item_id !== undefined) updateData.item_id = item_id
    if (unidad_medida !== undefined) updateData.unidad_medida = unidad_medida
    if (activo !== undefined) updateData.activo = activo
    if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio ? new Date(fecha_inicio) : null
    if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin ? new Date(fecha_fin) : null

    const descuento = await db.descuentoVolumen.update({
      where: { id: parsedId },
      data: updateData,
      include: {
        rangos: {
          orderBy: { cantidad_desde: 'asc' },
        },
      },
    })

    return NextResponse.json(descuento)
  } catch (error) {
    console.error('Error al actualizar descuento por volumen:', error)
    return NextResponse.json({ error: 'Error al actualizar descuento por volumen' }, { status: 500 })
  }
}

// DELETE /api/descuentos-volumen/[id] — Soft delete (set activo = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbReady()
    const { id } = await params
    const parsedId = parseInt(id)

    // Verify the descuento exists
    const existing = await db.descuentoVolumen.findUnique({ where: { id: parsedId } })
    if (!existing) {
      return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 })
    }

    await db.descuentoVolumen.update({
      where: { id: parsedId },
      data: { activo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar descuento por volumen:', error)
    return NextResponse.json({ error: 'Error al eliminar descuento por volumen' }, { status: 500 })
  }
}
