import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/presupuestos/[id] - Obtener presupuesto por ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const presupuesto = await db.presupuesto.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            razon_social: true,
            cuit: true,
            condicion_iva: true,
            tipo_persona: true,
            contactos: {
              include: {
                tipo: true,
              },
            },
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
    })

    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(presupuesto)
  } catch (error) {
    console.error('Error al obtener presupuesto:', error)
    return NextResponse.json({ error: 'Error al obtener presupuesto' }, { status: 500 })
  }
}

// PUT /api/presupuestos/[id] - Actualizar presupuesto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { observaciones, fecha_validez, estado, iva, detalles } = body

    const presupuestoExistente = await db.presupuesto.findUnique({
      where: { id: parseInt(id) },
    })

    if (!presupuestoExistente) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    // Si hay detalles, recalcular
    let subtotal = presupuestoExistente.subtotal
    let ivaAmount = presupuestoExistente.iva
    let total = presupuestoExistente.total

    if (detalles && detalles.length > 0) {
      // Borrar detalles anteriores y crear nuevos
      await db.detallePresupuesto.deleteMany({
        where: { id_presupuesto: parseInt(id) },
      })

      subtotal = 0
      const detallesData = []

      for (const detalle of detalles) {
        const cantidadNum = parseFloat(detalle.cantidad)
        const precioNum = parseFloat(detalle.precio_unitario)
        const subtotalLinea = cantidadNum * precioNum
        subtotal += subtotalLinea

        detallesData.push({
          id_producto_terminado: parseInt(detalle.id_producto_terminado),
          cantidad: cantidadNum,
          precio_unitario: precioNum,
          subtotal: subtotalLinea,
        })
      }

      ivaAmount = iva ? parseFloat(iva) : 0
      total = subtotal + ivaAmount

      await db.detallePresupuesto.createMany({
        data: detallesData.map(d => ({ ...d, id_presupuesto: parseInt(id) })),
      })
    }

    const presupuesto = await db.presupuesto.update({
      where: { id: parseInt(id) },
      data: {
        observaciones: observaciones !== undefined ? observaciones : undefined,
        fecha_validez: fecha_validez ? new Date(fecha_validez) : undefined,
        estado: estado || undefined,
        subtotal,
        iva: ivaAmount,
        total,
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

    return NextResponse.json(presupuesto)
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error)
    return NextResponse.json({ error: 'Error al actualizar presupuesto' }, { status: 500 })
  }
}
