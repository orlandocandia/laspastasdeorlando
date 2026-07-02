import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/promociones
export async function GET(request: NextRequest) {
  try {
    await ensureDbReady()
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    const tipo = searchParams.get('tipo')

    const where: Record<string, unknown> = {}
    if (activo !== null && activo !== '' && activo !== 'all') where.activo = activo === 'true'
    if (tipo) where.tipo = tipo

    const promociones = await db.promocion.findMany({
      where,
      include: {
        productos: {
          include: {
            productoTerminado: { select: { id: true, nombre: true, precio_venta: true } },
            categoria: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { fecha_inicio: 'desc' },
    })

    return NextResponse.json({ data: promociones, total: promociones.length })
  } catch (error) {
    console.error('Error al obtener promociones:', error)
    return NextResponse.json({ error: 'Error al obtener promociones' }, { status: 500 })
  }
}

// POST /api/promociones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, tipo, valor_descuento, fecha_inicio, fecha_fin, aplicar_auto, productos } = body

    if (!nombre || !tipo || valor_descuento === undefined || !fecha_inicio) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const promocion = await db.promocion.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        tipo,
        valor_descuento: parseFloat(valor_descuento),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        aplicar_auto: aplicar_auto || false,
        productos: productos && productos.length > 0
          ? {
              create: productos.map((p: { id_producto_terminado?: number; id_categoria?: number }) => ({
                id_producto_terminado: p.id_producto_terminado || 0,
                id_categoria: p.id_categoria || null,
              })),
            }
          : undefined,
      },
      include: {
        productos: {
          include: {
            productoTerminado: { select: { id: true, nombre: true, precio_venta: true } },
            categoria: { select: { id: true, nombre: true } },
          },
        },
      },
    })

    return NextResponse.json(promocion, { status: 201 })
  } catch (error) {
    console.error('Error al crear promoción:', error)
    return NextResponse.json({ error: 'Error al crear promoción' }, { status: 500 })
  }
}
