import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reportes/stock - Datos para reporte de stock
// Parámetros de filtro:
//   categoria_pt  — filtra productos terminados por categoría
//   categoria_mp  — filtra materias primas por categoría
//   proveedor_id  — filtra MP/Insumos que figuran en compras del proveedor
//   solo_stock_bajo — (booleano "true") muestra solo items con stock <= mínimo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria_pt = searchParams.get('categoria_pt')
    const categoria_mp = searchParams.get('categoria_mp')
    const proveedor_id = searchParams.get('proveedor_id')
    const solo_stock_bajo = searchParams.get('solo_stock_bajo') === 'true'

    // --- Materias Primas ---
    const whereMP: Record<string, unknown> = { estado: true }
    if (categoria_mp) whereMP.id_categoria = Number(categoria_mp)
    if (proveedor_id) {
      // MP que aparecen en al menos una compra del proveedor seleccionado
      whereMP.detalleCompras = {
        some: { compra: { id_proveedor: Number(proveedor_id) } },
      }
    }
    let materiasPrimas = await db.materiaPrima.findMany({
      where: whereMP,
      include: { categoria: true, unidadBase: true },
      orderBy: { nombre: 'asc' },
    })
    if (solo_stock_bajo) {
      materiasPrimas = materiasPrimas.filter((mp) => mp.stock_actual <= mp.stock_minimo)
    }

    // --- Insumos ---
    const whereInsumo: Record<string, unknown> = { estado: true }
    if (proveedor_id) {
      whereInsumo.detalleCompras = {
        some: { compra: { id_proveedor: Number(proveedor_id) } },
      }
    }
    let insumos = await db.insumo.findMany({
      where: whereInsumo,
      include: { tipoInsumo: true, unidadBase: true },
      orderBy: { nombre: 'asc' },
    })
    if (solo_stock_bajo) {
      insumos = insumos.filter((ins) => ins.stock_actual <= ins.stock_minimo)
    }

    // --- Productos Terminados ---
    const wherePT: Record<string, unknown> = { estado: true }
    if (categoria_pt) wherePT.id_categoria = Number(categoria_pt)
    let productosTerminados = await db.productoTerminado.findMany({
      where: wherePT,
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    })
    if (solo_stock_bajo) {
      productosTerminados = productosTerminados.filter((pt) => pt.stock_actual <= pt.stock_minimo)
    }

    // Stock crítico (sobre el subconjunto filtrado)
    const mpCritico = materiasPrimas.filter((mp) => mp.stock_actual <= mp.stock_minimo)
    const insumoCritico = insumos.filter((ins) => ins.stock_actual <= ins.stock_minimo)
    const ptCritico = productosTerminados.filter((pt) => pt.stock_actual <= pt.stock_minimo)

    // Valorización de stock (sobre el subconjunto filtrado)
    const valorMP = materiasPrimas.reduce((acc, mp) => acc + mp.stock_actual * mp.precio_compra_referencia, 0)
    const valorInsumos = insumos.reduce((acc, ins) => acc + ins.stock_actual * ins.precio_compra_referencia, 0)
    const valorPT = productosTerminados.reduce((acc, pt) => acc + pt.stock_actual * pt.precio_venta, 0)

    return NextResponse.json({
      resumen: {
        totalMP: materiasPrimas.length,
        totalInsumos: insumos.length,
        totalPT: productosTerminados.length,
        stockCriticoMP: mpCritico.length,
        stockCriticoInsumos: insumoCritico.length,
        stockCriticoPT: ptCritico.length,
        valorStockMP: valorMP,
        valorStockInsumos: valorInsumos,
        valorStockPT: valorPT,
        valorStockTotal: valorMP + valorInsumos + valorPT,
      },
      alertasStock: [
        ...mpCritico.map((mp) => ({
          tipo: 'Materia Prima',
          nombre: mp.nombre,
          stock_actual: mp.stock_actual,
          stock_minimo: mp.stock_minimo,
          unidad: mp.unidadBase?.codigo || '',
        })),
        ...insumoCritico.map((ins) => ({
          tipo: 'Insumo',
          nombre: ins.nombre,
          stock_actual: ins.stock_actual,
          stock_minimo: ins.stock_minimo,
          unidad: ins.unidadBase?.codigo || '',
        })),
        ...ptCritico.map((pt) => ({
          tipo: 'Producto Terminado',
          nombre: pt.nombre,
          stock_actual: pt.stock_actual,
          stock_minimo: pt.stock_minimo,
          unidad: 'u',
        })),
      ],
      materiasPrimas,
      insumos,
      productosTerminados,
    })
  } catch (error) {
    console.error('Error al obtener reporte de stock:', error)
    return NextResponse.json({ error: 'Error al obtener reporte de stock' }, { status: 500 })
  }
}
