import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/compras - Listar compras con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const id_proveedor = searchParams.get('id_proveedor')
    const id_estado = searchParams.get('id_estado')
    const buscar = searchParams.get('buscar')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}

    if (fecha_desde || fecha_hasta) {
      where.fecha_compra = {}
      if (fecha_desde) (where.fecha_compra as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_compra as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const parsedProveedor = parseInt(id_proveedor)
    if (id_proveedor && !isNaN(parsedProveedor)) where.id_proveedor = parsedProveedor
    const parsedEstado = parseInt(id_estado)
    if (id_estado && !isNaN(parsedEstado)) where.id_estado = parsedEstado

    if (buscar) {
      where.OR = [
        { numero_factura: { contains: buscar } },
        { observaciones: { contains: buscar } },
        { proveedor: { nombre: { contains: buscar } } },
        { proveedor: { apellido: { contains: buscar } } },
        { proveedor: { razon_social: { contains: buscar } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.compra.findMany({
        where,
        include: {
          proveedor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razon_social: true,
              numero_documento: true,
              tipo_persona: true,
            },
          },
          formaPago: true,
          estado: true,
          detalle: {
            include: {
              materiaPrima: true,
              insumo: true,
              marca: true,
              unidadCompra: true,
            },
          },
        },
        orderBy: { fecha_compra: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.compra.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener compras:', error)
    return NextResponse.json({ error: 'Error al obtener compras' }, { status: 500 })
  }
}

// POST /api/compras - Crear compra con detalles y actualización de stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_proveedor,
      id_forma_pago,
      numero_factura,
      fecha_compra,
      observaciones,
      detalles,
    } = body

    // Validaciones básicas
    const missingFields: string[] = []
    if (!id_proveedor) missingFields.push('id_proveedor')
    if (!id_forma_pago) missingFields.push('id_forma_pago')
    if (!fecha_compra) missingFields.push('fecha_compra')
    if (!detalles || detalles.length === 0) missingFields.push('detalles')

    if (missingFields.length > 0) {
      console.error('Compra POST - Campos faltantes:', missingFields, { id_proveedor, id_forma_pago, fecha_compra, detallesCount: detalles?.length })
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Obtener el estado "pendiente"
    const estadoPendiente = await db.estadoGeneral.findFirst({
      where: { nombre_estado: 'pendiente' },
    })
    if (!estadoPendiente) {
      return NextResponse.json(
        { error: 'No se encontró el estado "pendiente" en la base de datos' },
        { status: 400 }
      )
    }

    // Procesar detalles: calcular precio_total y cantidad_base
    const detallesProcesados = []
    let subtotal = 0

    for (const detalle of detalles) {
      const {
        tipo,
        id_materia_prima,
        id_insumo,
        id_marca,
        cantidad_comprada,
        id_unidad_compra,
        precio_unitario,
        fecha_vencimiento,
        lote,
      } = detalle

      if (!tipo || !cantidad_comprada || !id_unidad_compra || precio_unitario === undefined) {
        return NextResponse.json(
          { error: 'Cada detalle debe tener tipo, cantidad_comprada, id_unidad_compra y precio_unitario' },
          { status: 400 }
        )
      }

      if (tipo === 'materia_prima' && !id_materia_prima) {
        return NextResponse.json(
          { error: 'Los detalles de tipo materia_prima deben tener id_materia_prima' },
          { status: 400 }
        )
      }

      if (tipo === 'insumo' && !id_insumo) {
        return NextResponse.json(
          { error: 'Los detalles de tipo insumo deben tener id_insumo' },
          { status: 400 }
        )
      }

      const precio_total = parseFloat(cantidad_comprada) * parseFloat(precio_unitario)
      subtotal += precio_total

      // Obtener la materia prima o insumo para calcular la cantidad_base
      let id_unidad_base: number
      let stock_actual: number

      if (tipo === 'materia_prima') {
        const mp = await db.materiaPrima.findUnique({
          where: { id: parseInt(id_materia_prima) },
          include: { unidadBase: true },
        })
        if (!mp) {
          return NextResponse.json(
            { error: `Materia prima con id ${id_materia_prima} no encontrada` },
            { status: 400 }
          )
        }
        id_unidad_base = mp.id_unidad_base
        stock_actual = mp.stock_actual
      } else {
        const ins = await db.insumo.findUnique({
          where: { id: parseInt(id_insumo) },
          include: { unidadBase: true },
        })
        if (!ins) {
          return NextResponse.json(
            { error: `Insumo con id ${id_insumo} no encontrado` },
            { status: 400 }
          )
        }
        id_unidad_base = ins.id_unidad_base
        stock_actual = ins.stock_actual
      }

      // Obtener la unidad de compra para su factor de conversión
      const unidadCompra = await db.unidadMedida.findUnique({
        where: { id: parseInt(id_unidad_compra) },
      })
      if (!unidadCompra) {
        return NextResponse.json(
          { error: `Unidad de compra con id ${id_unidad_compra} no encontrada` },
          { status: 400 }
        )
      }

      // Calcular cantidad_base: cantidad_comprada * conversion_a_base de la unidad de compra
      const cantidad_base = parseFloat(cantidad_comprada) * unidadCompra.conversion_a_base
      const precio_por_unidad_base = cantidad_base > 0 ? precio_total / cantidad_base : 0

      const stock_despues = stock_actual + cantidad_base

      detallesProcesados.push({
        tipo,
        id_materia_prima: tipo === 'materia_prima' ? parseInt(id_materia_prima) : null,
        id_insumo: tipo === 'insumo' ? parseInt(id_insumo) : null,
        id_marca: id_marca ? parseInt(id_marca) : null,
        cantidad_comprada: parseFloat(cantidad_comprada),
        id_unidad_compra: parseInt(id_unidad_compra),
        precio_unitario: parseFloat(precio_unitario),
        precio_total,
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
        lote: lote || null,
        cantidad_base,
        precio_por_unidad_base,
        id_unidad_base,
        stock_antes: stock_actual,
        stock_despues,
      })
    }

    const iva = subtotal * 0.21
    const total = subtotal + iva

    // Ejecutar todo en una transacción
    const compra = await db.$transaction(async (tx) => {
      // Crear la compra
      const nuevaCompra = await tx.compra.create({
        data: {
          id_proveedor: parseInt(id_proveedor),
          id_forma_pago: parseInt(id_forma_pago),
          numero_factura: numero_factura || null,
          fecha_compra: new Date(fecha_compra),
          subtotal,
          iva,
          total,
          id_estado: estadoPendiente.id,
          observaciones: observaciones || null,
        },
      })

      // Crear los detalles y actualizar stock
      for (const detalle of detallesProcesados) {
        // Crear detalle de compra
        await tx.detalleCompra.create({
          data: {
            id_compra: nuevaCompra.id,
            id_materia_prima: detalle.id_materia_prima,
            id_insumo: detalle.id_insumo,
            id_marca: detalle.id_marca,
            cantidad_comprada: detalle.cantidad_comprada,
            id_unidad_compra: detalle.id_unidad_compra,
            precio_unitario: detalle.precio_unitario,
            precio_total: detalle.precio_total,
            fecha_vencimiento: detalle.fecha_vencimiento,
            lote: detalle.lote,
            cantidad_base: detalle.cantidad_base,
            precio_por_unidad_base: detalle.precio_por_unidad_base,
          },
        })

        // Actualizar stock de materia prima o insumo
        if (detalle.tipo === 'materia_prima' && detalle.id_materia_prima) {
          await tx.materiaPrima.update({
            where: { id: detalle.id_materia_prima },
            data: { stock_actual: detalle.stock_despues },
          })
        } else if (detalle.tipo === 'insumo' && detalle.id_insumo) {
          await tx.insumo.update({
            where: { id: detalle.id_insumo },
            data: { stock_actual: detalle.stock_despues },
          })
        }

        // Crear registro de movimiento de stock
        await tx.stockMovement.create({
          data: {
            tipo_movimiento: 'compra',
            id_materia_prima: detalle.id_materia_prima,
            id_insumo: detalle.id_insumo,
            cantidad: detalle.cantidad_base,
            id_unidad: detalle.id_unidad_base,
            stock_antes: detalle.stock_antes,
            stock_despues: detalle.stock_despues,
            referencia_id: nuevaCompra.id,
            referencia_tabla: 'compra',
            observacion: `Compra #${nuevaCompra.id}`,
          },
        })
      }

      // Retornar la compra con todos los includes
      return tx.compra.findUnique({
        where: { id: nuevaCompra.id },
        include: {
          proveedor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razon_social: true,
              numero_documento: true,
              tipo_persona: true,
            },
          },
          formaPago: true,
          estado: true,
          detalle: {
            include: {
              materiaPrima: true,
              insumo: true,
              marca: true,
              unidadCompra: true,
            },
          },
        },
      })
    })

    return NextResponse.json(compra, { status: 201 })
  } catch (error) {
    console.error('Error al crear compra:', error)
    return NextResponse.json({ error: 'Error al crear compra' }, { status: 500 })
  }
}
