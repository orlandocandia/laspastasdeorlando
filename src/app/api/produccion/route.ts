import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/produccion - Listar producciones con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const id_estado = searchParams.get('id_estado')
    const id_receta = searchParams.get('id_receta')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}

    if (fecha_desde || fecha_hasta) {
      where.fecha_produccion = {}
      if (fecha_desde) (where.fecha_produccion as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_produccion as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const parsedEstadoProd = parseInt(id_estado)
    if (id_estado && !isNaN(parsedEstadoProd)) where.id_estado = parsedEstadoProd
    const parsedReceta = parseInt(id_receta)
    if (id_receta && !isNaN(parsedReceta)) where.id_receta = parsedReceta

    const [data, total] = await Promise.all([
      db.produccion.findMany({
        where,
        include: {
          receta: {
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
          supervisor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razon_social: true,
              numero_documento: true,
              contactos: {
                include: {
                  tipo: true,
                },
              },
            },
          },
          estado: true,
          detalleConsumos: {
            include: {
              materiaPrima: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true,
                },
              },
              insumo: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true,
                },
              },
              unidad: true,
            },
          },
          detalleGenerados: {
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
        orderBy: { fecha_produccion: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.produccion.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener producciones:', error)
    return NextResponse.json({ error: 'Error al obtener producciones' }, { status: 500 })
  }
}

// POST /api/produccion - Crear producción con cálculo automático de consumos y costos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_receta,
      cantidad_producida,
      fecha_produccion,
      id_supervisor,
      observaciones,
    } = body

    // Validaciones básicas
    if (!id_receta || !cantidad_producida || !fecha_produccion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id_receta, cantidad_producida, fecha_produccion' },
        { status: 400 }
      )
    }

    const cantidadNum = parseInt(cantidad_producida)
    if (cantidadNum <= 0) {
      return NextResponse.json(
        { error: 'cantidad_producida debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Cargar la receta con sus detalles
    const receta = await db.receta.findUnique({
      where: { id: parseInt(id_receta) },
      include: {
        detalleRecetas: {
          include: {
            materiaPrima: true,
            insumo: true,
            unidad: true,
          },
        },
        productoTerminado: true,
      },
    })

    if (!receta) {
      return NextResponse.json(
        { error: `Receta con id ${id_receta} no encontrada` },
        { status: 400 }
      )
    }

    if (!receta.activo) {
      return NextResponse.json(
        { error: 'La receta no está activa' },
        { status: 400 }
      )
    }

    // Obtener el estado "planificado" (crear si no existe)
    let estadoPlanificado = await db.estadoGeneral.findFirst({
      where: { nombre_estado: 'planificado' },
    })
    if (!estadoPlanificado) {
      console.warn('[Produccion] Estado "planificado" no encontrado, creándolo...')
      try {
        estadoPlanificado = await db.estadoGeneral.create({
          data: {
            nombre_estado: 'planificado',
            entidad_aplicable: 'produccion',
            es_final: false,
          },
        })
      } catch (createError) {
        console.error('[Produccion] Error al crear estado "planificado":', createError)
        return NextResponse.json(
          { error: 'No se encontró ni se pudo crear el estado "planificado" en la base de datos. Ejecutá el seed primero.' },
          { status: 400 }
        )
      }
    }

    // Calcular el factor de escala: cuántas veces se produce la receta
    const factorEscala = cantidadNum / receta.rendimiento_unidades

    // Calcular consumos y costos
    let costoTotalMateriasPrimas = 0
    let costoTotalInsumos = 0
    const consumosData: Array<{
      id_materia_prima: number | null
      id_insumo: number | null
      cantidad_consumida: number
      id_unidad: number
      costo_unitario: number
      costo_total: number
    }> = []

    for (const detalle of receta.detalleRecetas) {
      const cantidadConsumida = detalle.cantidad_necesaria * factorEscala
      let costoUnitario = 0

      if (detalle.materiaPrima) {
        costoUnitario = detalle.materiaPrima.precio_compra_referencia
        costoTotalMateriasPrimas += cantidadConsumida * costoUnitario
      } else if (detalle.insumo) {
        costoUnitario = detalle.insumo.precio_compra_referencia
        costoTotalInsumos += cantidadConsumida * costoUnitario
      }

      consumosData.push({
        id_materia_prima: detalle.id_materia_prima,
        id_insumo: detalle.id_insumo,
        cantidad_consumida: cantidadConsumida,
        id_unidad: detalle.id_unidad,
        costo_unitario: costoUnitario,
        costo_total: cantidadConsumida * costoUnitario,
      })
    }

    // Calcular costo del producto generado (costo total = materias primas + insumos)
    const costoTotal = costoTotalMateriasPrimas + costoTotalInsumos
    const costoUnitarioGenerado = cantidadNum > 0 ? costoTotal / cantidadNum : 0

    // Ejecutar todo en una transacción
    const produccion = await db.$transaction(async (tx) => {
      // Crear la producción
      const nuevaProduccion = await tx.produccion.create({
        data: {
          id_receta: parseInt(id_receta),
          id_supervisor: id_supervisor ? parseInt(id_supervisor) : null,
          cantidad_producida: cantidadNum,
          fecha_produccion: new Date(fecha_produccion),
          costo_total_materias_primas: costoTotalMateriasPrimas,
          costo_total_insumos: costoTotalInsumos,
          costo_total: costoTotal,
          id_estado: estadoPlanificado.id,
          observaciones: observaciones || null,
        },
      })

      // Crear los consumos (detalle de materias primas e insumos utilizados)
      for (const consumo of consumosData) {
        await tx.detalleProduccionConsumo.create({
          data: {
            id_produccion: nuevaProduccion.id,
            id_materia_prima: consumo.id_materia_prima,
            id_insumo: consumo.id_insumo,
            cantidad_consumida: consumo.cantidad_consumida,
            id_unidad: consumo.id_unidad,
            costo_unitario: consumo.costo_unitario,
            costo_total: consumo.costo_total,
          },
        })
      }

      // Crear el detalle de producto generado
      await tx.detalleProduccionGenerado.create({
        data: {
          id_produccion: nuevaProduccion.id,
          id_producto_terminado: receta.id_producto_terminado,
          cantidad_generada: cantidadNum,
          costo_unitario: costoUnitarioGenerado,
          costo_total: costoTotal,
        },
      })

      // Retornar la producción con todos los includes
      return tx.produccion.findUnique({
        where: { id: nuevaProduccion.id },
        include: {
          receta: {
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
          supervisor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razon_social: true,
              numero_documento: true,
              contactos: {
                include: {
                  tipo: true,
                },
              },
            },
          },
          estado: true,
          detalleConsumos: {
            include: {
              materiaPrima: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true,
                },
              },
              insumo: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true,
                },
              },
              unidad: true,
            },
          },
          detalleGenerados: {
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

    return NextResponse.json(produccion, { status: 201 })
  } catch (error) {
    console.error('Error al crear producción:', error)
    const message = error instanceof Error ? error.message : 'Error al crear producción'
    return NextResponse.json({ error: 'Error al crear producción', detail: message }, { status: 500 })
  }
}
