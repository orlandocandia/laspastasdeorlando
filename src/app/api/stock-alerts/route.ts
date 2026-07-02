import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stock-alerts - Resumen de alertas de stock para el dashboard
export async function GET() {
  try {
    // Productos terminados
    const pts = await db.productoTerminado.findMany({
      where: { estado: true },
      select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
    })

    const ptSinStock = pts.filter(p => p.stock_actual <= 0).length
    const ptStockBajo = pts.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
    const ptOk = pts.filter(p => p.stock_actual > p.stock_minimo).length

    // Materias primas
    const mps = await db.materiaPrima.findMany({
      where: { estado: true },
      select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
    })

    const mpSinStock = mps.filter(m => m.stock_actual <= 0).length
    const mpStockBajo = mps.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo).length

    // Insumos
    const inss = await db.insumo.findMany({
      where: { estado: true },
      select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
    })

    const insSinStock = inss.filter(i => i.stock_actual <= 0).length
    const insStockBajo = inss.filter(i => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo).length

    // Recetas activas
    const recetasActivas = await db.receta.count({
      where: { activo: true },
    })

    // Producciones pendientes
    const estadoPlanificado = await db.estadoGeneral.findFirst({
      where: { nombre_estado: 'planificado' },
    })
    const estadoEnCurso = await db.estadoGeneral.findFirst({
      where: { nombre_estado: 'en_curso' },
    })

    let produccionPendiente = 0
    if (estadoPlanificado || estadoEnCurso) {
      const estadoIds = [estadoPlanificado?.id, estadoEnCurso?.id].filter(Boolean) as number[]
      produccionPendiente = await db.produccion.count({
        where: { id_estado: { in: estadoIds } },
      })
    }

    // Detail lists
    const ptSinStockList = pts.filter(p => p.stock_actual <= 0).map(p => ({ id: p.id, nombre: p.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo }))
    const ptStockBajoList = pts.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).map(p => ({ id: p.id, nombre: p.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo }))
    const mpSinStockList = mps.filter(m => m.stock_actual <= 0).map(m => ({ id: m.id, nombre: m.nombre, stock_actual: m.stock_actual, stock_minimo: m.stock_minimo }))
    const mpStockBajoList = mps.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo).map(m => ({ id: m.id, nombre: m.nombre, stock_actual: m.stock_actual, stock_minimo: m.stock_minimo }))
    const insSinStockList = inss.filter(i => i.stock_actual <= 0).map(i => ({ id: i.id, nombre: i.nombre, stock_actual: i.stock_actual, stock_minimo: i.stock_minimo }))
    const insStockBajoList = inss.filter(i => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo).map(i => ({ id: i.id, nombre: i.nombre, stock_actual: i.stock_actual, stock_minimo: i.stock_minimo }))

    return NextResponse.json({
      productos_terminados: {
        sin_stock: ptSinStock,
        stock_bajo: ptStockBajo,
        ok: ptOk,
        total: pts.length,
        sin_stock_list: ptSinStockList,
        stock_bajo_list: ptStockBajoList,
      },
      materias_primas: {
        sin_stock: mpSinStock,
        stock_bajo: mpStockBajo,
        ok: mps.filter(m => m.stock_actual > m.stock_minimo).length,
        total: mps.length,
        sin_stock_list: mpSinStockList,
        stock_bajo_list: mpStockBajoList,
      },
      insumos: {
        sin_stock: insSinStock,
        stock_bajo: insStockBajo,
        ok: inss.filter(i => i.stock_actual > i.stock_minimo).length,
        total: inss.length,
        sin_stock_list: insSinStockList,
        stock_bajo_list: insStockBajoList,
      },
      recetas_activas: recetasActivas,
      produccion_pendiente: produccionPendiente,
    })
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error)
    return NextResponse.json({ error: 'Error al obtener alertas de stock' }, { status: 500 })
  }
}
