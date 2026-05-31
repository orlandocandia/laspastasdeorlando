import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ventas - Listar ventas con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const id_cliente = searchParams.get('id_cliente')
    const id_estado = searchParams.get('id_estado')
    const id_forma_pago = searchParams.get('id_forma_pago')
    const buscar = searchParams.get('buscar')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}

    if (fecha_desde || fecha_hasta) {
      where.fecha_venta = {}
      if (fecha_desde) (where.fecha_venta as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_venta as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const parsedCliente = parseInt(id_cliente)
    if (id_cliente && !isNaN(parsedCliente)) where.id_cliente = parsedCliente
    const parsedEstadoVenta = parseInt(id_estado)
    if (id_estado && !isNaN(parsedEstadoVenta)) where.id_estado = parsedEstadoVenta
    const parsedFormaPago = parseInt(id_forma_pago)
    if (id_forma_pago && !isNaN(parsedFormaPago)) where.id_forma_pago = parsedFormaPago

    if (buscar) {
      where.OR = [
        { numero_comprobante: { contains: buscar } },
        { cliente: { nombre: { contains: buscar } } },
        { cliente: { apellido: { contains: buscar } } },
        { cliente: { razon_social: { contains: buscar } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.venta.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razon_social: true,
              numero_documento: true,
              tipo_persona: true,
            },
          },
          vendedor: {
            select: {
              id: true,
              email: true,
              persona: {
                select: {
                  nombre: true,
                  apellido: true,
                },
              },
            },
          },
          formaPago: true,
          estado: true,
          detalle: {
            include: {
              productoTerminado: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  precio_venta: true,
                },
              },
            },
          },
        },
        orderBy: { fecha_venta: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.venta.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
  }
}

// POST /api/ventas - Crear venta con detalles y registro de stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_cliente,
      id_vendedor,
      id_forma_pago,
      id_pedido,
      numero_comprobante,
      fecha_venta,
      detalles,
    } = body

    // Validaciones básicas
    if (!id_cliente || !id_vendedor || !id_forma_pago || !fecha_venta || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id_cliente, id_vendedor, id_forma_pago, fecha_venta, detalles' },
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

    // Procesar detalles: calcular subtotal por línea, subtotal, iva, total
    let subtotal = 0
    const detallesProcesados = []

    // Obtener unidad por defecto para productos terminados (tipo "unidad")
    const unidadDefault = await db.unidadMedida.findFirst({
      where: { tipo_medida: 'unidad' },
    })
    const idUnidadDefault = unidadDefault?.id ?? 1

    for (const detalle of detalles) {
      const { id_producto_terminado, cantidad, precio_unitario } = detalle

      if (!id_producto_terminado || !cantidad || precio_unitario === undefined) {
        return NextResponse.json(
          { error: 'Cada detalle debe tener id_producto_terminado, cantidad y precio_unitario' },
          { status: 400 }
        )
      }

      const cantidadNum = parseFloat(cantidad)
      const precioNum = parseFloat(precio_unitario)
      const subtotalLinea = cantidadNum * precioNum
      subtotal += subtotalLinea

      // Verificar que el producto terminado existe
      const pt = await db.productoTerminado.findUnique({
        where: { id: parseInt(id_producto_terminado) },
      })
      if (!pt) {
        return NextResponse.json(
          { error: `Producto terminado con id ${id_producto_terminado} no encontrado` },
          { status: 400 }
        )
      }

      detallesProcesados.push({
        id_producto_terminado: parseInt(id_producto_terminado),
        cantidad: cantidadNum,
        precio_unitario: precioNum,
        subtotal: subtotalLinea,
        nombreProducto: pt.nombre,
      })
    }

    const iva = subtotal * 0.21
    const total = subtotal + iva

    // Ejecutar todo en una transacción
    const venta = await db.$transaction(async (tx) => {
      // Crear la venta
      const nuevaVenta = await tx.venta.create({
        data: {
          id_cliente: parseInt(id_cliente),
          id_vendedor: parseInt(id_vendedor),
          id_forma_pago: parseInt(id_forma_pago),
          id_pedido: id_pedido ? parseInt(id_pedido) : null,
          numero_comprobante: numero_comprobante || null,
          fecha_venta: new Date(fecha_venta),
          subtotal,
          iva,
          total,
          id_estado: estadoPendiente.id,
        },
      })

      // Crear los detalles y registrar movimientos de stock
      for (const detalle of detallesProcesados) {
        await tx.detalleVenta.create({
          data: {
            id_venta: nuevaVenta.id,
            id_producto_terminado: detalle.id_producto_terminado,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            subtotal: detalle.subtotal,
          },
        })

        // Crear registro de movimiento de stock (auditoría - salida)
        // Actualizar stock_actual del ProductoTerminado
        const ptForStock = await tx.productoTerminado.findUnique({
          where: { id: detalle.id_producto_terminado },
        })
        const stockAntesPT = ptForStock?.stock_actual ?? 0
        const stockDespuesPT = Math.max(0, stockAntesPT - detalle.cantidad)

        await tx.productoTerminado.update({
          where: { id: detalle.id_producto_terminado },
          data: { stock_actual: stockDespuesPT },
        })

        await tx.stockMovement.create({
          data: {
            tipo_movimiento: 'venta',
            id_producto_terminado: detalle.id_producto_terminado,
            cantidad: -detalle.cantidad,
            id_unidad: idUnidadDefault,
            stock_antes: stockAntesPT,
            stock_despues: stockDespuesPT,
            referencia_id: nuevaVenta.id,
            referencia_tabla: 'venta',
            observacion: `Venta #${nuevaVenta.id} - ${detalle.nombreProducto} x${detalle.cantidad}`,
          },
        })
      }

      // Retornar la venta con todos los includes
      return tx.venta.findUnique({
        where: { id: nuevaVenta.id },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razon_social: true,
              numero_documento: true,
              tipo_persona: true,
            },
          },
          vendedor: {
            select: {
              id: true,
              email: true,
              persona: {
                select: {
                  nombre: true,
                  apellido: true,
                },
              },
            },
          },
          formaPago: true,
          estado: true,
          pedido: true,
          detalle: {
            include: {
              productoTerminado: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  precio_venta: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json(venta, { status: 201 })
  } catch (error) {
    console.error('Error al crear venta:', error)
    return NextResponse.json({ error: 'Error al crear venta' }, { status: 500 })
  }
}
