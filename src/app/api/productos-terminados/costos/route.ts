import { NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/productos-terminados/costos - Calcular costo de producción para todos los productos
export async function GET() {
  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const productos = await db.productoTerminado.findMany({
      where: { estado: true },
      include: {
        recetas: {
          where: { activo: true },
          include: {
            detalleRecetas: {
              include: {
                materiaPrima: { select: { id: true, nombre: true, precio_compra_referencia: true } },
                insumo: { select: { id: true, nombre: true, precio_compra_referencia: true } },
              },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    const data = productos.map((producto) => {
      const recetaActiva = producto.recetas?.[0]
      let costoMP = 0
      let costoInsumos = 0
      let costoProduccion = 0
      let tieneReceta = false
      let recetaNombre: string | null = null
      let rendimientoUnidades: number | null = null

      if (recetaActiva) {
        tieneReceta = true
        recetaNombre = recetaActiva.nombre_receta
        rendimientoUnidades = recetaActiva.rendimiento_unidades

        costoMP = recetaActiva.detalleRecetas
          .filter((d) => d.materiaPrima)
          .reduce((sum, d) => sum + d.costo_estimado, 0)

        costoInsumos = recetaActiva.detalleRecetas
          .filter((d) => d.insumo)
          .reduce((sum, d) => sum + d.costo_estimado, 0)

        costoProduccion =
          recetaActiva.rendimiento_unidades > 0
            ? (costoMP + costoInsumos) / recetaActiva.rendimiento_unidades
            : 0
      }

      const margen = producto.precio_venta - costoProduccion
      const margenPorcentaje =
        producto.precio_venta > 0 ? (margen / producto.precio_venta) * 100 : 0

      return {
        id: producto.id,
        nombre: producto.nombre,
        precio_venta: producto.precio_venta,
        costo_produccion: Math.round(costoProduccion * 100) / 100,
        margen: Math.round(margen * 100) / 100,
        margen_porcentaje: Math.round(margenPorcentaje * 100) / 100,
        tiene_receta: tieneReceta,
        receta_nombre: recetaNombre,
        rendimiento_unidades: rendimientoUnidades,
        costo_ingredientes_mp: Math.round(costoMP * 100) / 100,
        costo_ingredientes_insumos: Math.round(costoInsumos * 100) / 100,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error al calcular costos de producción:', error)
    return NextResponse.json(
      { error: 'Error al calcular costos de producción' },
      { status: 500 }
    )
  }
}
