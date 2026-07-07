import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reportes/produccion - Datos para reporte de producción
// Parámetros de filtro:
//   fecha_desde, fecha_hasta — rango de fecha_produccion
//   producto_id              — filtra por producto terminado (vía receta)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const producto_id = searchParams.get('producto_id')

    const where: Record<string, unknown> = {}
    if (fecha_desde || fecha_hasta) {
      where.fecha_produccion = {}
      if (fecha_desde) (where.fecha_produccion as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) {
        const h = new Date(fecha_hasta)
        h.setHours(23, 59, 59, 999)
        ;(where.fecha_produccion as Record<string, unknown>).lte = h
      }
    }
    if (producto_id) {
      where.receta = { id_producto_terminado: Number(producto_id) }
    }

    const producciones = await db.produccion.findMany({
      where,
      include: {
        receta: {
          include: {
            productoTerminado: { select: { id: true, nombre: true, precio_venta: true } },
          },
        },
        supervisor: { select: { id: true, nombre: true, apellido: true } },
        estado: true,
        detalleConsumos: {
          include: {
            materiaPrima: { select: { nombre: true } },
            insumo: { select: { nombre: true } },
          },
        },
        detalleGenerados: {
          include: {
            productoTerminado: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha_produccion: 'desc' },
    })

    const totalProducido = producciones.reduce((acc, p) => acc + p.cantidad_producida, 0)
    const costoTotal = producciones.reduce((acc, p) => acc + p.costo_total, 0)

    // Costos por producto
    const costosMap = new Map<string, { producto: string; producido: number; costoTotal: number; costoPromedio: number }>()
    for (const prod of producciones) {
      const nombre = prod.receta.productoTerminado.nombre
      const existing = costosMap.get(nombre) || { producto: nombre, producido: 0, costoTotal: 0, costoPromedio: 0 }
      existing.producido += prod.cantidad_producida
      existing.costoTotal += prod.costo_total
      costosMap.set(nombre, existing)
    }
    const costosPorProducto = Array.from(costosMap.values())
      .map((c) => ({
        ...c,
        costoPromedio: c.producido > 0 ? c.costoTotal / c.producido : 0,
      }))
      .sort((a, b) => b.costoTotal - a.costoTotal)

    return NextResponse.json({
      resumen: {
        totalProducciones: producciones.length,
        totalProducido,
        costoTotal,
        costoPromedio: totalProducido > 0 ? costoTotal / totalProducido : 0,
      },
      costosPorProducto,
      producciones,
    })
  } catch (error) {
    console.error('Error al obtener reporte de producción:', error)
    return NextResponse.json({ error: 'Error al obtener reporte de producción' }, { status: 500 })
  }
}
