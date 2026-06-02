import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { recetaIncludes } from '@/lib/prisma-utils'

// GET /api/recetas/[id] - Obtener una receta por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const receta = await db.receta.findUnique({
      where: { id: parseInt(id) },
      include: recetaIncludes,
    })

    if (!receta) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
    }

    return NextResponse.json(receta)
  } catch (error) {
    console.error('Error al obtener receta:', error)
    return NextResponse.json({ error: 'Error al obtener receta' }, { status: 500 })
  }
}

// PUT /api/recetas/[id] - Actualizar receta y reemplazar detalles
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const { id } = await params
    const body = await request.json()
    const {
      nombre_receta,
      id_producto_terminado,
      rendimiento_unidades,
      activo,
      detalles,
    } = body

    // Verificar que la receta existe
    const recetaExistente = await db.receta.findUnique({
      where: { id: parseInt(id) },
    })
    if (!recetaExistente) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
    }

    // Si se envían detalles, validarlos
    if (detalles !== undefined) {
      if (!Array.isArray(detalles) || detalles.length === 0) {
        return NextResponse.json(
          { error: 'Debe incluir al menos un detalle en la receta' },
          { status: 400 }
        )
      }

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
    }

    // Si se cambia el producto terminado, verificar que existe
    if (id_producto_terminado) {
      const productoTerminado = await db.productoTerminado.findUnique({
        where: { id: parseInt(id_producto_terminado) },
      })
      if (!productoTerminado) {
        return NextResponse.json(
          { error: `Producto terminado con id ${id_producto_terminado} no encontrado` },
          { status: 400 }
        )
      }
    }

    // Actualizar receta y reemplazar detalles en transacción
    const receta = await db.$transaction(async (tx) => {
      // Construir datos de actualización
      const updateData: Record<string, unknown> = {}
      if (nombre_receta !== undefined) updateData.nombre_receta = nombre_receta
      if (id_producto_terminado !== undefined) updateData.id_producto_terminado = parseInt(id_producto_terminado)
      if (rendimiento_unidades !== undefined) updateData.rendimiento_unidades = parseInt(rendimiento_unidades)
      if (activo !== undefined) updateData.activo = Boolean(activo)

      // Actualizar la receta
      await tx.receta.update({
        where: { id: parseInt(id) },
        data: updateData,
      })

      // Si se enviaron detalles, eliminar los anteriores y crear los nuevos
      if (detalles !== undefined) {
        // Eliminar detalles anteriores
        await tx.detalleReceta.deleteMany({
          where: { id_receta: parseInt(id) },
        })

        // Crear los nuevos detalles
        for (const detalle of detalles) {
          const { tipo, id_materia_prima, id_insumo, cantidad_necesaria, id_unidad, costo_estimado = 0 } = detalle

          await tx.detalleReceta.create({
            data: {
              id_receta: parseInt(id),
              id_materia_prima: tipo === 'mp' ? parseInt(id_materia_prima) : null,
              id_insumo: tipo === 'insumo' ? parseInt(id_insumo) : null,
              cantidad_necesaria: parseFloat(cantidad_necesaria),
              id_unidad: parseInt(id_unidad),
              costo_estimado: parseFloat(costo_estimado) || 0,
            },
          })
        }
      }

      // Retornar la receta actualizada con todos los includes
      return tx.receta.findUnique({
        where: { id: parseInt(id) },
        include: recetaIncludes,
      })
    })

    return NextResponse.json(receta)
  } catch (error) {
    console.error('Error al actualizar receta:', error)
    return NextResponse.json({ error: 'Error al actualizar receta' }, { status: 500 })
  }
}

// DELETE /api/recetas/[id] - Eliminar receta y sus detalles
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const { id } = await params
    const recetaId = parseInt(id)

    const receta = await db.receta.findUnique({
      where: { id: recetaId },
    })
    if (!receta) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
    }

    // Delete in transaction: first detalles, then receta
    await db.$transaction(async (tx) => {
      await tx.detalleReceta.deleteMany({
        where: { id_receta: recetaId },
      })
      await tx.receta.delete({
        where: { id: recetaId },
      })
    })

    return NextResponse.json({ message: 'Receta eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar receta:', error)
    return NextResponse.json({ error: 'Error al eliminar receta' }, { status: 500 })
  }
}
