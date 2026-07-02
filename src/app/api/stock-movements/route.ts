import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/stock-movements - Listar movimientos de stock con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo_movimiento = searchParams.get('tipo_movimiento')
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const id_materia_prima = searchParams.get('id_materia_prima')
    const id_insumo = searchParams.get('id_insumo')
    const id_producto_terminado = searchParams.get('id_producto_terminado')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: Record<string, unknown> = {}

    if (tipo_movimiento && tipo_movimiento !== 'all') where.tipo_movimiento = tipo_movimiento
    const parsedMP = parseInt(id_materia_prima)
    if (id_materia_prima && !isNaN(parsedMP)) where.id_materia_prima = parsedMP
    const parsedIns = parseInt(id_insumo)
    if (id_insumo && !isNaN(parsedIns)) where.id_insumo = parsedIns
    const parsedPT = parseInt(id_producto_terminado)
    if (id_producto_terminado && !isNaN(parsedPT)) where.id_producto_terminado = parsedPT

    if (fecha_desde || fecha_hasta) {
      where.fecha_movimiento = {}
      if (fecha_desde) (where.fecha_movimiento as Record<string, unknown>).gte = new Date(fecha_desde)
      if (fecha_hasta) (where.fecha_movimiento as Record<string, unknown>).lte = new Date(fecha_hasta)
    }

    const [data, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          materiaPrima: {
            select: { id: true, nombre: true, codigo: true },
          },
          insumo: {
            select: { id: true, nombre: true, codigo: true },
          },
          productoTerminado: {
            select: { id: true, nombre: true, codigo: true },
          },
          unidad: true,
          usuario: {
            select: { id: true, email: true, persona: { select: { nombre: true, apellido: true } } },
          },
        },
        orderBy: { fecha_movimiento: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.stockMovement.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener movimientos de stock:', error)
    return NextResponse.json({ error: 'Error al obtener movimientos de stock' }, { status: 500 })
  }
}

// POST /api/stock-movements - Crear ajuste de stock manual (carga inicial, corrección, etc.)
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const {
      tipo_item, // 'producto_terminado' | 'materia_prima' | 'insumo'
      item_id,
      cantidad, // positiva = sumar, negativa = restar
      motivo, // 'carga_inicial' | 'ajuste' | 'correccion' | 'devolucion'
      observacion,
    } = body

    if (!tipo_item || !item_id || cantidad === undefined || !motivo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: tipo_item, item_id, cantidad, motivo' },
        { status: 400 }
      )
    }

    const cantidadNum = parseFloat(cantidad)
    if (isNaN(cantidadNum) || cantidadNum === 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser un número distinto de 0' },
        { status: 400 }
      )
    }

    const motivosValidos = ['carga_inicial', 'ajuste', 'correccion', 'devolucion']
    if (!motivosValidos.includes(motivo)) {
      return NextResponse.json(
        { error: `Motivo inválido. Válidos: ${motivosValidos.join(', ')}` },
        { status: 400 }
      )
    }

    const tipoMovimiento = cantidadNum > 0 ? 'ajuste_in' : 'ajuste_out'
    const itemId = parseInt(item_id)

    // Obtener la unidad por defecto
    const unidadDefault = await db.unidadMedida.findFirst({
      where: { tipo_medida: 'unidad' },
    })
    const idUnidad = unidadDefault?.id ?? 1

    const result = await db.$transaction(async (tx) => {
      let stockAntes = 0
      let stockDespues = 0
      let nombreItem = ''

      if (tipo_item === 'producto_terminado') {
        const pt = await tx.productoTerminado.findUnique({ where: { id: itemId } })
        if (!pt) throw new Error('Producto terminado no encontrado')
        stockAntes = pt.stock_actual
        stockDespues = stockAntes + cantidadNum
        nombreItem = pt.nombre

        await tx.productoTerminado.update({
          where: { id: itemId },
          data: { stock_actual: Math.max(0, stockDespues) },
        })
      } else if (tipo_item === 'materia_prima') {
        const mp = await tx.materiaPrima.findUnique({ where: { id: itemId } })
        if (!mp) throw new Error('Materia prima no encontrada')
        stockAntes = mp.stock_actual
        stockDespues = stockAntes + cantidadNum
        nombreItem = mp.nombre

        await tx.materiaPrima.update({
          where: { id: itemId },
          data: { stock_actual: Math.max(0, stockDespues) },
        })
      } else if (tipo_item === 'insumo') {
        const ins = await tx.insumo.findUnique({ where: { id: itemId } })
        if (!ins) throw new Error('Insumo no encontrado')
        stockAntes = ins.stock_actual
        stockDespues = stockAntes + cantidadNum
        nombreItem = ins.nombre

        await tx.insumo.update({
          where: { id: itemId },
          data: { stock_actual: Math.max(0, stockDespues) },
        })
      } else {
        throw new Error('tipo_item inválido. Usar: producto_terminado, materia_prima, insumo')
      }

      // Crear movimiento de stock
      const movementData: Record<string, unknown> = {
        tipo_movimiento: tipoMovimiento,
        cantidad: cantidadNum,
        id_unidad: idUnidad,
        stock_antes: stockAntes,
        stock_despues: Math.max(0, stockDespues),
        referencia_tabla: motivo,
        observacion: observacion || `${motivo === 'carga_inicial' ? 'Carga inicial' : motivo === 'ajuste' ? 'Ajuste manual' : motivo === 'correccion' ? 'Corrección' : 'Devolución'} — ${nombreItem}`,
        fecha_movimiento: new Date(),
      }

      if (tipo_item === 'producto_terminado') movementData.id_producto_terminado = itemId
      else if (tipo_item === 'materia_prima') movementData.id_materia_prima = itemId
      else if (tipo_item === 'insumo') movementData.id_insumo = itemId

      const movement = await tx.stockMovement.create({ data: movementData })

      return {
        movement,
        stock_antes: stockAntes,
        stock_despues: Math.max(0, stockDespues),
        nombre_item: nombreItem,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error al crear ajuste de stock:', error)
    const message = error instanceof Error ? error.message : 'Error al crear ajuste de stock'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
