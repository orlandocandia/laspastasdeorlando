import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/descuentos-volumen/calcular
// Calculate the best volume discount for a given product + quantity
export async function GET(request: NextRequest) {
  try {
    await ensureDbReady()
    const { searchParams } = new URL(request.url)
    const producto_id = searchParams.get('producto_id')
    const cantidad = searchParams.get('cantidad')
    const unidad = searchParams.get('unidad')

    if (!producto_id || !cantidad) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: producto_id, cantidad' },
        { status: 400 }
      )
    }

    const parsedProductoId = parseInt(producto_id)
    const parsedCantidad = parseFloat(cantidad)

    if (isNaN(parsedProductoId) || isNaN(parsedCantidad) || parsedCantidad <= 0) {
      return NextResponse.json(
        { error: 'Parámetros inválidos: producto_id debe ser un entero, cantidad debe ser un número positivo' },
        { status: 400 }
      )
    }

    // 1. Find the product to get its precio_venta and categoria_id
    const producto = await db.productoTerminado.findUnique({
      where: { id: parsedProductoId },
      select: { id: true, precio_venta: true, id_categoria: true },
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    const precio_original = producto.precio_venta
    const today = new Date()

    // 2. Find all active DescuentoVolumen matching the product/category/todos
    //    and within date validity (fecha_inicio <= today OR null, fecha_fin >= today OR null)
    const descuentos = await db.descuentoVolumen.findMany({
      where: {
        activo: true,
        OR: [
          { tipo_item: 'todos' },
          { tipo_item: 'producto', item_id: parsedProductoId },
          { tipo_item: 'categoria', item_id: producto.id_categoria },
        ],
        AND: [
          {
            OR: [
              { fecha_inicio: null },
              { fecha_inicio: { lte: today } },
            ],
          },
          {
            OR: [
              { fecha_fin: null },
              { fecha_fin: { gte: today } },
            ],
          },
        ],
      },
      include: {
        rangos: {
          orderBy: { cantidad_desde: 'asc' },
        },
      },
    })

    // 3. For each matching discount, find the rango where:
    //    cantidad_desde <= cantidad AND (cantidad_hasta IS NULL OR cantidad_hasta >= cantidad)
    //    Also filter by unidad_medida if the 'unidad' param is provided
    interface MatchResult {
      descuento: {
        id: number
        nombre: string
        tipo_descuento: string
        valor: number
        cantidad_desde: number
        cantidad_hasta: number | null
        unidad_medida: string
        descripcion: string | null
      }
      descuento_aplicado: number
    }

    const matches: MatchResult[] = []

    for (const descuento of descuentos) {
      // Filter by unidad_medida if the 'unidad' query param is provided
      if (unidad && descuento.unidad_medida !== unidad) continue

      // Find the first matching rango (rangos are ordered by cantidad_desde asc)
      const matchingRango = descuento.rangos.find(
        (rango) =>
          rango.cantidad_desde <= parsedCantidad &&
          (rango.cantidad_hasta === null || rango.cantidad_hasta >= parsedCantidad)
      )

      if (matchingRango) {
        // Calculate the discount amount
        let descuento_aplicado: number
        if (matchingRango.tipo_descuento === 'porcentaje') {
          descuento_aplicado = (precio_original * matchingRango.valor) / 100
        } else {
          // "fijo" — fixed amount off
          descuento_aplicado = matchingRango.valor
        }

        matches.push({
          descuento: {
            id: descuento.id,
            nombre: descuento.nombre,
            tipo_descuento: matchingRango.tipo_descuento,
            valor: matchingRango.valor,
            cantidad_desde: matchingRango.cantidad_desde,
            cantidad_hasta: matchingRango.cantidad_hasta,
            unidad_medida: descuento.unidad_medida,
            descripcion: matchingRango.descripcion,
          },
          descuento_aplicado,
        })
      }
    }

    // 4. Return the best discount (highest monetary value)
    if (matches.length === 0) {
      return NextResponse.json({
        descuento: null,
        precio_original,
        descuento_aplicado: 0,
        precio_final: precio_original,
      })
    }

    const bestMatch = matches.reduce((best, current) =>
      current.descuento_aplicado > best.descuento_aplicado ? current : best
    )

    const precio_final = Math.max(0, precio_original - bestMatch.descuento_aplicado)

    return NextResponse.json({
      descuento: bestMatch.descuento,
      precio_original,
      descuento_aplicado: bestMatch.descuento_aplicado,
      precio_final,
    })
  } catch (error) {
    console.error('Error al calcular descuento por volumen:', error)
    return NextResponse.json({ error: 'Error al calcular descuento por volumen' }, { status: 500 })
  }
}
