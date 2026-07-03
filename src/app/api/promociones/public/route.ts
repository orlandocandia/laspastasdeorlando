import { NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/promociones/public - Landing page (público, sin auth)
// Returns only active promotions with valid dates, including product details
export async function GET() {
  try {
    await ensureDbReady()

    const now = new Date()

    const promociones = await db.promocion.findMany({
      where: {
        activo: true,
        fecha_inicio: { lte: now },
        OR: [
          { fecha_fin: null },
          { fecha_fin: { gte: now } },
        ],
      },
      include: {
        productos: {
          include: {
            productoTerminado: {
              select: {
                id: true,
                nombre: true,
                precio_venta: true,
                imagen: true,
                peso_unitario_aprox: true,
                descripcion: true,
                stock_actual: true,
                visible_en_landing: true,
                estado: true,
                categoria: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fecha_inicio: 'desc' },
    })

    // Build a map of productId → best promotion for quick lookup
    const productoPromociones: Record<number, {
      promocionId: number
      promocionNombre: string
      tipo: string
      valor_descuento: number
      precio_original: number
      precio_final: number
      descuento_label: string
    }> = {}

    for (const promo of promociones) {
      for (const pp of promo.productos) {
        if (!pp.productoTerminado) continue
        if (!pp.productoTerminado.visible_en_landing || !pp.productoTerminado.estado) continue

        const prodId = pp.productoTerminado.id
        const precioOriginal = pp.productoTerminado.precio_venta
        let precioFinal = precioOriginal
        let descuentoLabel = ''

        switch (promo.tipo) {
          case 'porcentual':
          case 'tiempo_limitado': {
            const desc = promo.valor_descuento
            precioFinal = precioOriginal * (1 - desc / 100)
            descuentoLabel = `${desc}% OFF`
            break
          }
          case 'fijo': {
            precioFinal = Math.max(0, precioOriginal - promo.valor_descuento)
            descuentoLabel = `$${Math.round(promo.valor_descuento)} OFF`
            break
          }
          case '2x1': {
            precioFinal = precioOriginal / 2
            descuentoLabel = '2x1'
            break
          }
        }

        // Keep the best discount (lowest final price) if multiple promos apply
        if (!productoPromociones[prodId] || precioFinal < productoPromociones[prodId].precio_final) {
          productoPromociones[prodId] = {
            promocionId: promo.id,
            promocionNombre: promo.nombre,
            tipo: promo.tipo,
            valor_descuento: promo.valor_descuento,
            precio_original: precioOriginal,
            precio_final: Math.round(precioFinal * 100) / 100,
            descuento_label: descuentoLabel,
          }
        }
      }
    }

    // Also build category-level promotions: if a promo applies to a whole category,
    // all products in that category get the discount
    for (const promo of promociones) {
      for (const pp of promo.productos) {
        if (!pp.id_categoria) continue
        // Find all products in this category that are visible and active
        const productsInCategory = await db.productoTerminado.findMany({
          where: {
            id_categoria: pp.id_categoria,
            visible_en_landing: true,
            estado: true,
          },
          select: {
            id: true,
            precio_venta: true,
          },
        })

        for (const prod of productsInCategory) {
          if (productoPromociones[prod.id]) continue // Already has a better promo

          const precioOriginal = prod.precio_venta
          let precioFinal = precioOriginal
          let descuentoLabel = ''

          switch (promo.tipo) {
            case 'porcentual':
            case 'tiempo_limitado': {
              const desc = promo.valor_descuento
              precioFinal = precioOriginal * (1 - desc / 100)
              descuentoLabel = `${desc}% OFF`
              break
            }
            case 'fijo': {
              precioFinal = Math.max(0, precioOriginal - promo.valor_descuento)
              descuentoLabel = `$${Math.round(promo.valor_descuento)} OFF`
              break
            }
            case '2x1': {
              precioFinal = precioOriginal / 2
              descuentoLabel = '2x1'
              break
            }
          }

          productoPromociones[prod.id] = {
            promocionId: promo.id,
            promocionNombre: promo.nombre,
            tipo: promo.tipo,
            valor_descuento: promo.valor_descuento,
            precio_original: precioOriginal,
            precio_final: Math.round(precioFinal * 100) / 100,
            descuento_label: descuentoLabel,
          }
        }
      }
    }

    // Build the promotions list for the "Ofertas Especiales" section
    const promocionesPublicas = promociones.map((promo) => {
      const productosPromo = promo.productos
        .filter((pp) => pp.productoTerminado && pp.productoTerminado.visible_en_landing && pp.productoTerminado.estado)
        .map((pp) => ({
          id: pp.productoTerminado!.id,
          nombre: pp.productoTerminado!.nombre,
          precio_venta: pp.productoTerminado!.precio_venta,
          imagen: pp.productoTerminado!.imagen,
          peso_unitario_aprox: pp.productoTerminado!.peso_unitario_aprox,
          descripcion: pp.productoTerminado!.descripcion,
          stock_actual: pp.productoTerminado!.stock_actual,
          categoria: pp.productoTerminado!.categoria,
        }))

      let descuentoLabel = ''
      switch (promo.tipo) {
        case 'porcentual':
        case 'tiempo_limitado':
          descuentoLabel = `${promo.valor_descuento}% OFF`
          break
        case 'fijo':
          descuentoLabel = `$${Math.round(promo.valor_descuento)} OFF`
          break
        case '2x1':
          descuentoLabel = '2x1'
          break
      }

      return {
        id: promo.id,
        nombre: promo.nombre,
        descripcion: promo.descripcion,
        tipo: promo.tipo,
        valor_descuento: promo.valor_descuento,
        fecha_fin: promo.fecha_fin,
        descuento_label: descuentoLabel,
        productos: productosPromo,
      }
    }).filter((p) => p.productos.length > 0)

    return NextResponse.json({
      promociones: promocionesPublicas,
      productoPromociones,
    })
  } catch (error) {
    console.error('Error al obtener promociones públicas:', error)
    return NextResponse.json(
      { error: 'Error al obtener promociones' },
      { status: 500 }
    )
  }
}
