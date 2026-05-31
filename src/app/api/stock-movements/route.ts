import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stock-movements - Listar movimientos de stock con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo_movimiento = searchParams.get('tipo_movimiento')
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const id_materia_prima = searchParams.get('id_materia_prima')
    const id_insumo = searchParams.get('id_insumo')
    const id_producto_terminado = searchParams.get('id_producto_terminado')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: Record<string, unknown> = {}

    if (tipo_movimiento && tipo_movimiento !== 'all') where.tipo_movimiento = tipo_movimiento
    const parsedMP = parseInt(id_materia_prima)
    if (id_materia_prima && !isNaN(parsedMP)) where.id_materia_prima = parsedMP
    const parsedIns = parseInt(id_insumo)
    if (id_insumo && !isNaN(parsedIns)) where.id_insumo = parsedIns
    const parsedPT = parseInt(id_producto_terminado)
    if (id_producto_terminado && !isNaN(parsedPT)) where.id_producto_terminado = parsedPT

    if (fecha_desde || fecha_hasta) {
      where.fecha_movimiento = {}
      if (fecha_desde) (where.fecha_movimiento as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_movimiento as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const [data, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          materiaPrima: {
            select: { id: true, nombre: true, codigo: true },
          },
          insumo: {
            select: { id: true, nombre: true, codigo: true },
          },
          productoTerminado: {
            select: { id: true, nombre: true, codigo: true },
          },
          unidad: true,
          usuario: {
            select: { id: true, email: true, persona: { select: { nombre: true, apellido: true } } },
          },
        },
        orderBy: { fecha_movimiento: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.stockMovement.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener movimientos de stock:', error)
    return NextResponse.json({ error: 'Error al obtener movimientos de stock' }, { status: 500 })
  }
}
