import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/categorias - Listar categorías con filtro por tipo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')

    if (tipo === 'materias-primas') {
      const materiasPrimas = await db.categoriaMateriaPrima.findMany({
        orderBy: { nombre: 'asc' },
      })
      return NextResponse.json(materiasPrimas)
    }

    if (tipo === 'productos-terminados') {
      const productosTerminados = await db.categoriaProductoTerminado.findMany({
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { productosTerminados: true } } },
      })
      return NextResponse.json(productosTerminados)
    }

    if (tipo === 'tipos-insumo') {
      const tiposInsumo = await db.tipoInsumo.findMany({
        orderBy: { nombre: 'asc' },
      })
      return NextResponse.json(tiposInsumo)
    }

    // No tipo → return all three types
    const [materiasPrimas, productosTerminados, tiposInsumo] = await Promise.all([
      db.categoriaMateriaPrima.findMany({ orderBy: { nombre: 'asc' } }),
      db.categoriaProductoTerminado.findMany({ orderBy: { nombre: 'asc' } }),
      db.tipoInsumo.findMany({ orderBy: { nombre: 'asc' } }),
    ])

    return NextResponse.json({
      materiasPrimas,
      productosTerminados,
      tiposInsumo,
    })
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

// POST /api/categorias - Crear categoría
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const { tipo, nombre, descripcion } = body

    if (!tipo || !nombre) {
      return NextResponse.json(
        { error: 'Los campos tipo y nombre son requeridos' },
        { status: 400 }
      )
    }

    if (tipo === 'materias-primas') {
      const categoria = await db.categoriaMateriaPrima.create({
        data: { nombre, descripcion: descripcion || null },
      })
      return NextResponse.json(categoria, { status: 201 })
    }

    if (tipo === 'productos-terminados') {
      const categoria = await db.categoriaProductoTerminado.create({
        data: {
          nombre,
          descripcion: descripcion || null,
          imagen: body.imagen || null,
          imagen_integral: body.imagen_integral || null,
          imagen_sin_gluten: body.imagen_sin_gluten || null,
        },
      })
      return NextResponse.json(categoria, { status: 201 })
    }

    if (tipo === 'tipos-insumo') {
      const tipoInsumo = await db.tipoInsumo.create({
        data: { nombre, descripcion: descripcion || null },
      })
      return NextResponse.json(tipoInsumo, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Tipo no válido. Use: materias-primas, productos-terminados o tipos-insumo' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}

// PUT /api/categorias - Actualizar categoría
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const { id, tipo, nombre, descripcion } = body

    if (!id || !tipo) {
      return NextResponse.json(
        { error: 'Los campos id y tipo son requeridos' },
        { status: 400 }
      )
    }

    if (tipo === 'materias-primas') {
      const updateDataMP: { nombre?: string; descripcion?: string | null } = {}
      if (nombre !== undefined) updateDataMP.nombre = nombre
      if (descripcion !== undefined) updateDataMP.descripcion = descripcion || null
      const categoria = await db.categoriaMateriaPrima.update({
        where: { id: parseInt(id) },
        data: updateDataMP,
      })
      return NextResponse.json(categoria)
    }

    if (tipo === 'productos-terminados') {
      const updateDataPT: { nombre?: string; descripcion?: string | null; imagen?: string | null; imagen_integral?: string | null; imagen_sin_gluten?: string | null } = {}
      if (nombre !== undefined) updateDataPT.nombre = nombre
      if (descripcion !== undefined) updateDataPT.descripcion = descripcion || null
      if (body.imagen !== undefined) updateDataPT.imagen = body.imagen || null
      if (body.imagen_integral !== undefined) updateDataPT.imagen_integral = body.imagen_integral || null
      if (body.imagen_sin_gluten !== undefined) updateDataPT.imagen_sin_gluten = body.imagen_sin_gluten || null
      const categoria = await db.categoriaProductoTerminado.update({
        where: { id: parseInt(id) },
        data: updateDataPT,
      })
      return NextResponse.json(categoria)
    }

    if (tipo === 'tipos-insumo') {
      const updateDataTI: { nombre?: string; descripcion?: string | null } = {}
      if (nombre !== undefined) updateDataTI.nombre = nombre
      if (descripcion !== undefined) updateDataTI.descripcion = descripcion || null
      const tipoInsumo = await db.tipoInsumo.update({
        where: { id: parseInt(id) },
        data: updateDataTI,
      })
      return NextResponse.json(tipoInsumo)
    }

    return NextResponse.json(
      { error: 'Tipo no válido. Use: materias-primas, productos-terminados o tipos-insumo' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 })
  }
}

// DELETE /api/categorias - Eliminar categoría
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const tipo = searchParams.get('tipo')

    if (!id || !tipo) {
      return NextResponse.json(
        { error: 'Los parámetros id y tipo son requeridos' },
        { status: 400 }
      )
    }

    if (tipo === 'materias-primas') {
      await db.categoriaMateriaPrima.delete({ where: { id: parseInt(id) } })
      return NextResponse.json({ message: 'Categoría de materia prima eliminada' })
    }

    if (tipo === 'productos-terminados') {
      await db.categoriaProductoTerminado.delete({ where: { id: parseInt(id) } })
      return NextResponse.json({ message: 'Categoría de producto terminado eliminada' })
    }

    if (tipo === 'tipos-insumo') {
      await db.tipoInsumo.delete({ where: { id: parseInt(id) } })
      return NextResponse.json({ message: 'Tipo de insumo eliminado' })
    }

    return NextResponse.json(
      { error: 'Tipo no válido. Use: materias-primas, productos-terminados o tipos-insumo' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 })
  }
}
