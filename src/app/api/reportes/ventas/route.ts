import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reportes/ventas - Datos para reporte de ventas
// Parámetros de filtro:
//   fecha_desde, fecha_hasta  — rango de fecha_venta
//   cliente_id                — filtra por cliente (Persona)
//   vendedor_id               — filtra por vendedor (Usuario)
//   producto_id               — filtra ventas que incluyen un producto terminado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const cliente_id = searchParams.get('cliente_id')
    const vendedor_id = searchParams.get('vendedor_id')
    const producto_id = searchParams.get('producto_id')

    const where: Record<string, unknown> = {}

    if (fecha_desde || fecha_hasta) {
      where.fecha_venta = {}
      if (fecha_desde) (where.fecha_venta as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) {
        // Incluir todo el día "hasta"
        const h = new Date(fecha_hasta)
        h.setHours(23, 59, 59, 999)
        ;(where.fecha_venta as Record<string, unknown>).lte = h
      }
    }

    if (cliente_id) where.id_cliente = Number(cliente_id)
    if (vendedor_id) where.id_vendedor = Number(vendedor_id)

    if (producto_id) {
      where.detalle = { some: { id_producto_terminado: Number(producto_id) } }
    }

    // Ventas por período
    const ventas = await db.venta.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, razon_social: true },
        },
        vendedor: {
          select: {
            id: true,
            email: true,
            persona: { select: { nombre: true, apellido: true } },
          },
        },
        formaPago: true,
        estado: true,
        detalle: {
          include: {
            productoTerminado: {
              select: { id: true, nombre: true, precio_venta: true },
            },
          },
        },
      },
      orderBy: { fecha_venta: 'desc' },
    })

    // Métricas
    const totalVentas = ventas.reduce((acc, v) => acc + v.total, 0)
    const cantidadVentas = ventas.length
    const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0

    // Productos más vendidos
    const productosMap = new Map<string, { nombre: string; cantidad: number; subtotal: number }>()
    for (const venta of ventas) {
      for (const det of venta.detalle) {
        // Si hay filtro de producto, solo contar ese producto en el ranking
        if (producto_id && det.id_producto_terminado !== Number(producto_id)) continue
        const key = det.productoTerminado.nombre
        const existing = productosMap.get(key) || { nombre: key, cantidad: 0, subtotal: 0 }
        existing.cantidad += det.cantidad
        existing.subtotal += det.subtotal
        productosMap.set(key, existing)
      }
    }
    const productosMasVendidos = Array.from(productosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    // Clientes más frecuentes
    const clientesMap = new Map<number, { nombre: string; compras: number; total: number }>()
    for (const venta of ventas) {
      const key = venta.id_cliente
      const nombre = venta.cliente.razon_social || `${venta.cliente.nombre} ${venta.cliente.apellido}`
      const existing = clientesMap.get(key) || { nombre, compras: 0, total: 0 }
      existing.compras += 1
      existing.total += venta.total
      clientesMap.set(key, existing)
    }
    const clientesMasFrecuentes = Array.from(clientesMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Ventas por día
    const ventasPorDia = new Map<string, { fecha: string; total: number; cantidad: number }>()
    for (const venta of ventas) {
      const fecha = new Date(venta.fecha_venta).toISOString().split('T')[0]
      const existing = ventasPorDia.get(fecha) || { fecha, total: 0, cantidad: 0 }
      existing.total += venta.total
      existing.cantidad += 1
      ventasPorDia.set(fecha, existing)
    }
    const ventasPorDiaArr = Array.from(ventasPorDia.values()).sort((a, b) => a.fecha.localeCompare(b.fecha))

    // Ventas por vendedor (agregación)
    const vendedoresMap = new Map<number, { nombre: string; ventas: number; total: number }>()
    for (const venta of ventas) {
      const key = venta.id_vendedor
      const nombre = venta.vendedor?.persona
        ? `${venta.vendedor.persona.nombre} ${venta.vendedor.persona.apellido}`.trim() || venta.vendedor.email
        : venta.vendedor?.email || `#${venta.id_vendedor}`
      const existing = vendedoresMap.get(key) || { nombre, ventas: 0, total: 0 }
      existing.ventas += 1
      existing.total += venta.total
      vendedoresMap.set(key, existing)
    }
    const ventasPorVendedor = Array.from(vendedoresMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return NextResponse.json({
      resumen: { totalVentas, cantidadVentas, ticketPromedio },
      ventasPorDia: ventasPorDiaArr,
      productosMasVendidos,
      clientesMasFrecuentes,
      ventasPorVendedor,
      ventas,
    })
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error)
    return NextResponse.json({ error: 'Error al obtener reporte de ventas' }, { status: 500 })
  }
}
