import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbReady()
    const { id } = await params
    const promocion = await db.promocion.findUnique({
      where: { id: parseInt(id) },
      include: {
        productos: {
          include: {
            productoTerminado: { select: { id: true, nombre: true, precio_venta: true } },
            categoria: { select: { id: true, nombre: true } },
          },
        },
      },
    })
    if (!promocion) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json(promocion)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nombre, descripcion, tipo, valor_descuento, fecha_inicio, fecha_fin, activo, aplicar_auto, productos } = body

    // If productos array provided, replace existing
    if (productos !== undefined) {
      await db.promocionProducto.deleteMany({ where: { id_promocion: parseInt(id) } })
      if (productos.length > 0) {
        await db.promocionProducto.createMany({
          data: productos.map((p: { id_producto_terminado?: number; id_categoria?: number }) => ({
            id_promocion: parseInt(id),
            id_producto_terminado: p.id_producto_terminado || 0,
            id_categoria: p.id_categoria || null,
          })),
        })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (tipo !== undefined) updateData.tipo = tipo
    if (valor_descuento !== undefined) updateData.valor_descuento = parseFloat(valor_descuento)
    if (fecha_inicio !== undefined) updateData.fecha_inicio = new Date(fecha_inicio)
    if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin ? new Date(fecha_fin) : null
    if (activo !== undefined) updateData.activo = activo
    if (aplicar_auto !== undefined) updateData.aplicar_auto = aplicar_auto

    const promocion = await db.promocion.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        productos: {
          include: {
            productoTerminado: { select: { id: true, nombre: true, precio_venta: true } },
            categoria: { select: { id: true, nombre: true } },
          },
        },
      },
    })

    return NextResponse.json(promocion)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.promocion.update({
      where: { id: parseInt(id) },
      data: { activo: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
