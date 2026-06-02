import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { recetaIncludes } from '@/lib/prisma-utils'

// GET /api/recetas - Listar recetas con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const id_producto_terminado = searchParams.get('id_producto_terminado')
    const activo = searchParams.get('activo')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: Record<string, unknown> = {}

    if (buscar) {
      where.nombre_receta = { contains: buscar }
    }

    const parsedProductoTerminado = parseInt(id_producto_terminado || '')
    if (id_producto_terminado && !isNaN(parsedProductoTerminado)) {
      where.id_producto_terminado = parsedProductoTerminado
    }

    if (activo !== null && activo !== undefined && activo !== '' && activo !== 'all') {
      where.activo = activo === 'true'
    }

    const [data, total] = await Promise.all([
      db.receta.findMany({
        where,
        include: recetaIncludes,
        orderBy: { id: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.receta.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener recetas:', error)
    return NextResponse.json({ error: 'Error al obtener recetas' }, { status: 500 })
  }
}

// POST /api/recetas - Crear receta con detalles
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const {
      nombre_receta,
      id_producto_terminado,
      rendimiento_unidades = 1,
      activo = true,
      detalles,
    } = body

    // Validaciones básicas
    if (!nombre_receta || !id_producto_terminado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre_receta, id_producto_terminado' },
        { status: 400 }
      )
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un detalle en la receta' },
        { status: 400 }
      )
    }

    // Verificar que el producto terminado existe
    const productoTerminado = await db.productoTerminado.findUnique({
      where: { id: parseInt(id_producto_terminado) },
    })
    if (!productoTerminado) {
      return NextResponse.json(
        { error: `Producto terminado con id ${id_producto_terminado} no encontrado` },
        { status: 400 }
      )
    }

    // Validar cada detalle
    for (let i = 0; i < detalles.length; i++) {
      const detalle = detalles[i]
      const { tipo, id_materia_prima, id_insumo, cantidad_necesaria, id_unidad } = detalle

      if (!tipo || (tipo !== 'mp' && tipo !== 'insumo')) {
        return NextResponse.json(
          { error: `Detalle ${i + 1}: tipo debe ser "mp" o "insumo"` },
          { status: 400 }
        )
      }

      if (tipo === 'mp' && !id_materia_prima) {
        return NextResponse.json(
          { error: `Detalle ${i + 1}: id_materia_prima es requerido cuando tipo es "mp"` },
          { status: 400 }
        )
      }

      if (tipo === 'insumo' && !id_insumo) {
        return NextResponse.json(
          { error: `Detalle ${i + 1}: id_insumo es requerido cuando tipo es "insumo"` },
          { status: 400 }
        )
      }

      if (!cantidad_necesaria || cantidad_necesaria <= 0) {
        return NextResponse.json(
          { error: `Detalle ${i + 1}: cantidad_necesaria debe ser mayor a 0` },
          { status: 400 }
        )
      }

      if (!id_unidad) {
        return NextResponse.json(
          { error: `Detalle ${i + 1}: id_unidad es requerido` },
          { status: 400 }
        )
      }
    }

    // Crear receta con detalles en transacción
    const receta = await db.$transaction(async (tx) => {
      const nuevaReceta = await tx.receta.create({
        data: {
          nombre_receta,
          id_producto_terminado: parseInt(id_producto_terminado),
          rendimiento_unidades: parseInt(rendimiento_unidades) || 1,
          activo: Boolean(activo),
        },
      })

      // Crear los detalles
      for (const detalle of detalles) {
        const { tipo, id_materia_prima, id_insumo, cantidad_necesaria, id_unidad, costo_estimado = 0 } = detalle

        await tx.detalleReceta.create({
          data: {
            id_receta: nuevaReceta.id,
            id_materia_prima: tipo === 'mp' ? parseInt(id_materia_prima) : null,
            id_insumo: tipo === 'insumo' ? parseInt(id_insumo) : null,
            cantidad_necesaria: parseFloat(cantidad_necesaria),
            id_unidad: parseInt(id_unidad),
            costo_estimado: parseFloat(costo_estimado) || 0,
          },
        })
      }

      // Retornar la receta con todos los includes
      return tx.receta.findUnique({
        where: { id: nuevaReceta.id },
        include: recetaIncludes,
      })
    })

    return NextResponse.json(receta, { status: 201 })
  } catch (error) {
    console.error('Error al crear receta:', error)
    return NextResponse.json({ error: 'Error al crear receta' }, { status: 500 })
  }
}
