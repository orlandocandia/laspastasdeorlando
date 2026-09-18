import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db, ensureDbReady } from '@/lib/db'

// GET /api/recetas-cocina - Listar recetas de cocina con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    await ensureDbReady()
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const categoria = searchParams.get('categoria')
    const dificultad = searchParams.get('dificultad')
    const visibleLanding = searchParams.get('visible_en_landing')
    const destacado = searchParams.get('destacado')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: Record<string, unknown> = {}

    if (buscar) {
      where.OR = [
        { titulo: { contains: buscar } },
        { descripcion: { contains: buscar } },
        { ingredientes: { contains: buscar } },
      ]
    }
    if (categoria && categoria !== 'all') where.categoria = categoria
    if (dificultad && dificultad !== 'all') where.dificultad = dificultad
    if (visibleLanding === 'true') where.visible_en_landing = true
    if (visibleLanding === 'false') where.visible_en_landing = false
    if (destacado === 'true') where.destacado = true
    if (destacado === 'false') where.destacado = false

    const [data, total] = await Promise.all([
      db.recetaCocina.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.recetaCocina.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener recetas de cocina:', error)
    return NextResponse.json({ error: 'Error al obtener recetas de cocina' }, { status: 500 })
  }
}

// POST /api/recetas-cocina - Crear nueva receta de cocina
export async function POST(request: NextRequest) {
  try {
    await ensureDbReady()
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

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

    const receta = await db.recetaCocina.create({
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

    return NextResponse.json(receta, { status: 201 })
  } catch (error) {
    console.error('Error al crear receta de cocina:', error)
    return NextResponse.json({ error: 'Error al crear receta de cocina' }, { status: 500 })
  }
}
