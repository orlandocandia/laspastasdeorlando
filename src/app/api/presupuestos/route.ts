import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/presupuestos - Listar presupuestos con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const estado = searchParams.get('estado')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: Record<string, unknown> = {}

    if (estado) where.estado = estado

    if (buscar) {
      where.OR = [
        { numero: { contains: buscar } },
        { cliente: { nombre: { contains: buscar } } },
        { cliente: { apellido: { contains: buscar } } },
        { cliente: { razon_social: { contains: buscar } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.presupuesto.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razon_social: true,
              cuit: true,
              condicion_iva: true,
            },
          },
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
          pedido: {
            select: { id: true },
          },
        },
        orderBy: { fecha_creacion: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.presupuesto.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener presupuestos:', error)
    return NextResponse.json({ error: 'Error al obtener presupuestos' }, { status: 500 })
  }
}

// POST /api/presupuestos - Crear presupuesto con detalles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_cliente,
      fecha_validez,
      observaciones,
      iva,
      detalles,
    } = body

    if (!id_cliente || !fecha_validez || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id_cliente, fecha_validez, detalles' },
        { status: 400 }
      )
    }

    // Generar número de presupuesto
    const ultimoPresupuesto = await db.presupuesto.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    const numero = `PRES-${(ultimoPresupuesto ? ultimoPresupuesto.id + 1 : 1).toString().padStart(6, '0')}`

    // Calcular subtotales
    let subtotal = 0
    interface DetalleData {
      id_producto_terminado: number
      cantidad: number
      precio_unitario: number
      subtotal: number
      descuento_volumen_id: number | null
      descuento_volumen_valor: number | null
      descuento_volumen_tipo: string | null
      precio_unitario_original: number | null
      descuento_unitario: number | null
      descuento_nombre: string | null
    }
    const detallesData: DetalleData[] = []

    for (const detalle of detalles) {
      const {
        id_producto_terminado,
        cantidad,
        precio_unitario,
        descuento_volumen_id,
        descuento_volumen_valor,
        descuento_volumen_tipo,
        precio_unitario_original,
        descuento_unitario,
        descuento_nombre,
      } = detalle

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

      // Snapshot del descuento por volumen aplicado (si vino del formulario)
      const descuentoVolumenId = descuento_volumen_id ? parseInt(descuento_volumen_id) : null
      const descuentoVolumenValor =
        descuento_volumen_valor !== undefined && descuento_volumen_valor !== null
          ? parseFloat(descuento_volumen_valor)
          : null
      const descuentoVolumenTipo = descuento_volumen_tipo || null
      const precioUnitarioOriginal =
        precio_unitario_original !== undefined && precio_unitario_original !== null
          ? parseFloat(precio_unitario_original)
          : null
      const descuentoUnitario =
        descuento_unitario !== undefined && descuento_unitario !== null
          ? parseFloat(descuento_unitario)
          : null
      const descuentoNombre = descuento_nombre || null

      detallesData.push({
        id_producto_terminado: parseInt(id_producto_terminado),
        cantidad: cantidadNum,
        precio_unitario: precioNum,
        subtotal: subtotalLinea,
        descuento_volumen_id: descuentoVolumenId,
        descuento_volumen_valor: descuentoVolumenValor,
        descuento_volumen_tipo: descuentoVolumenTipo,
        precio_unitario_original: precioUnitarioOriginal,
        descuento_unitario: descuentoUnitario,
        descuento_nombre: descuentoNombre,
      })
    }

    const ivaAmount = iva ? parseFloat(iva) : 0
    const total = subtotal + ivaAmount

    // Crear presupuesto con detalles
    const presupuesto = await db.presupuesto.create({
      data: {
        id_cliente: parseInt(id_cliente),
        numero,
        fecha_validez: new Date(fecha_validez),
        subtotal,
        iva: ivaAmount,
        total,
        observaciones: observaciones || null,
        estado: 'pendiente',
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
            cuit: true,
            condicion_iva: true,
          },
        },
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

    return NextResponse.json(presupuesto, { status: 201 })
  } catch (error) {
    console.error('Error al crear presupuesto:', error)
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 })
  }
}
