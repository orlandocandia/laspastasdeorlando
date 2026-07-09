import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/recetas-cocina/[id] - Obtener una receta por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbReady()
    const { id } = await params
    const receta = await db.recetaCocina.findUnique({
      where: { id: parseInt(id) },
    })

    if (!receta) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
    }

    return NextResponse.json(receta)
  } catch (error) {
    console.error('Error al obtener receta de cocina:', error)
    return NextResponse.json({ error: 'Error al obtener receta' }, { status: 500 })
  }
}

// PUT /api/recetas-cocina/[id] - Actualizar receta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbReady()
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      titulo,
      descripcion,
      ingredientes,
      pasos,
      tiempo_preparacion,
      tiempo_coccion,
      dificultad,
      imagen,
      categoria,
      visible_en_landing,
      destacado,
    } = body

    if (!titulo || !ingredientes || !pasos) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, ingredientes, pasos' },
        { status: 400 }
      )
    }

    const validDificultades = ['facil', 'media', 'dificil']
    const validCategorias = ['salsas', 'pastas', 'postres', 'aperitivos', 'bebidas', 'otros']

    const receta = await db.recetaCocina.update({
      where: { id: parseInt(id) },
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        ingredientes: ingredientes.trim(),
        pasos: pasos.trim(),
        tiempo_preparacion: tiempo_preparacion?.trim() || null,
        tiempo_coccion: tiempo_coccion?.trim() || null,
        dificultad: validDificultades.includes(dificultad) ? dificultad : 'facil',
        imagen: imagen || null,
        categoria: validCategorias.includes(categoria) ? categoria : 'otros',
        visible_en_landing: Boolean(visible_en_landing),
        destacado: Boolean(destacado),
      },
    })

    return NextResponse.json(receta)
  } catch (error) {
    console.error('Error al actualizar receta de cocina:', error)
    return NextResponse.json({ error: 'Error al actualizar receta' }, { status: 500 })
  }
}

// DELETE /api/recetas-cocina/[id] - Eliminar receta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbReady()
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await db.recetaCocina.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar receta de cocina:', error)
    return NextResponse.json({ error: 'Error al eliminar receta' }, { status: 500 })
  }
}
