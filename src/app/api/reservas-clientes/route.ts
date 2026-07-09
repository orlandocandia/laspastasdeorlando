import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reservas-clientes - Listar reservas de clientes con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const id_cliente = searchParams.get('id_cliente')
    const id_estado = searchParams.get('id_estado')
    const activa = searchParams.get('activa') === 'true'
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}

    if (fecha_desde || fecha_hasta) {
      where.fecha_reserva = {}
      if (fecha_desde) (where.fecha_reserva as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_reserva as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const parsedClienteRC = parseInt(id_cliente)
    if (id_cliente && !isNaN(parsedClienteRC)) where.id_cliente = parsedClienteRC
    const parsedEstadoRC = parseInt(id_estado)
    if (id_estado && !isNaN(parsedEstadoRC)) where.id_estado = parsedEstadoRC

    // activa=true: reservas vigentes (estados pendiente/confirmada/activa, no anuladas/expiradas/canceladas)
    if (activa) {
      const estadosActivos = await db.estadoGeneral.findMany({
        where: { entidad_aplicable: 'reserva_cliente', nombre_estado: { in: ['pendiente', 'confirmada', 'activa'] } },
        select: { id: true },
      })
      where.id_estado = { in: estadosActivos.map(e => e.id) }
    }

    const [data, total] = await Promise.all([
      db.reservaCliente.findMany({
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
          productoTerminado: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              precio_venta: true,
            },
          },
          estado: true,
          pedido: {
            select: {
              id: true,
              fecha_pedido: true,
              subtotal: true,
              total: true,
              estado: true,
            },
          },
        },
        orderBy: { fecha_reserva: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.reservaCliente.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener reservas de clientes:', error)
    return NextResponse.json({ error: 'Error al obtener reservas de clientes' }, { status: 500 })
  }
}

// POST /api/reservas-clientes - Crear reserva de cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_cliente,
      id_pedido,
      fecha_reserva,
      fecha_validez_hasta,
      id_producto_terminado,
      cantidad_reservada,
      senia,
    } = body

    // Validaciones básicas
    if (!id_cliente || !fecha_reserva || !fecha_validez_hasta || !id_producto_terminado || !cantidad_reservada) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id_cliente, fecha_reserva, fecha_validez_hasta, id_producto_terminado, cantidad_reservada' },
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

    const reserva = await db.reservaCliente.create({
      data: {
        id_cliente: parseInt(id_cliente),
        id_pedido: id_pedido ? parseInt(id_pedido) : null,
        fecha_reserva: new Date(fecha_reserva),
        fecha_validez_hasta: new Date(fecha_validez_hasta),
        id_producto_terminado: parseInt(id_producto_terminado),
        cantidad_reservada: parseFloat(cantidad_reservada),
        cantidad_confirmada: 0,
        senia: senia ? parseFloat(senia) : 0,
        id_estado: estadoPendiente.id,
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
        productoTerminado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            precio_venta: true,
          },
        },
        estado: true,
        pedido: {
          select: {
            id: true,
            fecha_pedido: true,
            subtotal: true,
            total: true,
            estado: true,
          },
        },
      },
    })

    return NextResponse.json(reserva, { status: 201 })
  } catch (error) {
    console.error('Error al crear reserva de cliente:', error)
    return NextResponse.json({ error: 'Error al crear reserva de cliente' }, { status: 500 })
  }
}
