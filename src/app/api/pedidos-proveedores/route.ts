import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/pedidos-proveedores - Listar pedidos a proveedores con paginación y filtros
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
      where.fecha_pedido = {}
      if (fecha_desde) (where.fecha_pedido as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_pedido as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const parsedProveedorPP = parseInt(id_proveedor)
    if (id_proveedor && !isNaN(parsedProveedorPP)) where.id_proveedor = parsedProveedorPP
    const parsedEstadoPP = parseInt(id_estado)
    if (id_estado && !isNaN(parsedEstadoPP)) where.id_estado = parsedEstadoPP

    if (buscar) {
      where.OR = [
        { observaciones: { contains: buscar } },
        { proveedor: { nombre: { contains: buscar } } },
        { proveedor: { apellido: { contains: buscar } } },
        { proveedor: { razon_social: { contains: buscar } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.pedidoProveedor.findMany({
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
          estado: true,
          detalle: {
            include: {
              materiaPrima: true,
              insumo: true,
              unidad: true,
            },
          },
        },
        orderBy: { fecha_pedido: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.pedidoProveedor.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener pedidos a proveedores:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos a proveedores' }, { status: 500 })
  }
}

// POST /api/pedidos-proveedores - Crear pedido a proveedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_proveedor,
      fecha_pedido,
      fecha_entrega_estimada,
      observaciones,
      detalles,
    } = body

    // Validaciones básicas
    if (!id_proveedor || !fecha_pedido || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id_proveedor, fecha_pedido, detalles' },
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

    // Calcular total_estimado
    let total_estimado = 0
    const detallesData = []

    for (const detalle of detalles) {
      const { id_materia_prima, id_insumo, cantidad_pedida, id_unidad, precio_estimado } = detalle

      if (!cantidad_pedida || !id_unidad || precio_estimado === undefined) {
        return NextResponse.json(
          { error: 'Cada detalle debe tener cantidad_pedida, id_unidad y precio_estimado' },
          { status: 400 }
        )
      }

      if (!id_materia_prima && !id_insumo) {
        return NextResponse.json(
          { error: 'Cada detalle debe tener id_materia_prima o id_insumo' },
          { status: 400 }
        )
      }

      const subtotal_detalle = parseFloat(cantidad_pedida) * parseFloat(precio_estimado)
      total_estimado += subtotal_detalle

      detallesData.push({
        id_materia_prima: id_materia_prima ? parseInt(id_materia_prima) : null,
        id_insumo: id_insumo ? parseInt(id_insumo) : null,
        cantidad_pedida: parseFloat(cantidad_pedida),
        id_unidad: parseInt(id_unidad),
        precio_estimado: parseFloat(precio_estimado),
      })
    }

    // Crear el pedido (NO afecta stock)
    const pedido = await db.pedidoProveedor.create({
      data: {
        id_proveedor: parseInt(id_proveedor),
        fecha_pedido: new Date(fecha_pedido),
        fecha_entrega_estimada: fecha_entrega_estimada ? new Date(fecha_entrega_estimada) : null,
        observaciones: observaciones || null,
        id_estado: estadoPendiente.id,
        total_estimado,
        detalle: {
          create: detallesData,
        },
      },
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
        estado: true,
        detalle: {
          include: {
            materiaPrima: true,
            insumo: true,
            unidad: true,
          },
        },
      },
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error) {
    console.error('Error al crear pedido a proveedor:', error)
    return NextResponse.json({ error: 'Error al crear pedido a proveedor' }, { status: 500 })
  }
}
