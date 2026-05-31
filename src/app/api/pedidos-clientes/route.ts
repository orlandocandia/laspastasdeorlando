import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/pedidos-clientes - Listar pedidos de clientes con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const id_cliente = searchParams.get('id_cliente')
    const id_estado = searchParams.get('id_estado')
    const buscar = searchParams.get('buscar')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}

    if (fecha_desde || fecha_hasta) {
      where.fecha_pedido = {}
      if (fecha_desde) (where.fecha_pedido as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_pedido as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const parsedClientePC = parseInt(id_cliente)
    if (id_cliente && !isNaN(parsedClientePC)) where.id_cliente = parsedClientePC
    const parsedEstadoPC = parseInt(id_estado)
    if (id_estado && !isNaN(parsedEstadoPC)) where.id_estado = parsedEstadoPC

    if (buscar) {
      where.OR = [
        { observaciones: { contains: buscar } },
        { cliente: { nombre: { contains: buscar } } },
        { cliente: { apellido: { contains: buscar } } },
        { cliente: { razon_social: { contains: buscar } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.pedidoCliente.findMany({
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
        orderBy: { fecha_pedido: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.pedidoCliente.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener pedidos de clientes:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos de clientes' }, { status: 500 })
  }
}

// POST /api/pedidos-clientes - Crear pedido de cliente con detalles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_cliente,
      fecha_pedido,
      fecha_entrega_solicitada,
      observaciones,
      senia,
      detalles,
    } = body

    // Validaciones básicas
    if (!id_cliente || !fecha_pedido || !fecha_entrega_solicitada || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id_cliente, fecha_pedido, fecha_entrega_solicitada, detalles' },
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

    // Procesar detalles: calcular subtotal por línea y total
    let subtotal = 0
    const detallesData = []

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

      detallesData.push({
        id_producto_terminado: parseInt(id_producto_terminado),
        cantidad: cantidadNum,
        precio_unitario: precioNum,
        subtotal: subtotalLinea,
      })
    }

    const total = subtotal

    // Crear el pedido con detalles
    const pedido = await db.pedidoCliente.create({
      data: {
        id_cliente: parseInt(id_cliente),
        fecha_pedido: new Date(fecha_pedido),
        fecha_entrega_solicitada: new Date(fecha_entrega_solicitada),
        subtotal,
        total,
        senia: senia ? parseFloat(senia) : 0,
        id_estado: estadoPendiente.id,
        observaciones: observaciones || null,
        detalle: {
          create: detallesData,
        },
      },
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
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error) {
    console.error('Error al crear pedido de cliente:', error)
    return NextResponse.json({ error: 'Error al crear pedido de cliente' }, { status: 500 })
  }
}
