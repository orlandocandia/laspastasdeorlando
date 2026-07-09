import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/materias-primas - Listar materias primas con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const id_categoria = searchParams.get('id_categoria')
    const estado = searchParams.get('estado')
    const stock = searchParams.get('stock')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}
    const parsedCategoria = parseInt(id_categoria)
    if (id_categoria && !isNaN(parsedCategoria)) where.id_categoria = parsedCategoria
    if (estado !== null && estado !== '' && estado !== 'all') where.estado = estado === 'true'
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar } },
        { codigo: { contains: buscar } },
      ]
    }
    // Stock filter
    if (stock === 'sin_stock') {
      where.stock_actual = { lte: 0 }
    }

    // For "stock_bajo" we need in-memory filtering (can't compare two columns in SQLite)
    const isStockBajoFilter = stock === 'stock_bajo' || stock === 'bajo'

    if (isStockBajoFilter) {
      const allItems = await db.materiaPrima.findMany({
        where,
        include: { categoria: true, unidadBase: true },
        orderBy: { nombre: 'asc' },
      })
      const filtered = allItems.filter(mp => mp.stock_actual > 0 && mp.stock_actual <= mp.stock_minimo)
      const total = filtered.length
      const start = (pagina - 1) * limite
      const data = filtered.slice(start, start + limite)

      return NextResponse.json({
        data,
        total,
        pagina,
        totalPaginas: Math.ceil(total / limite),
      })
    }

    const [data, total] = await Promise.all([
      db.materiaPrima.findMany({
        where,
        include: {
          categoria: true,
          unidadBase: true,
        },
        orderBy: { nombre: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.materiaPrima.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener materias primas:', error)
    return NextResponse.json({ error: 'Error al obtener materias primas' }, { status: 500 })
  }
}

// POST /api/materias-primas - Crear materia prima
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      codigo,
      nombre,
      descripcion,
      id_categoria,
      id_unidad_base,
      stock_actual,
      stock_minimo,
      precio_compra_referencia,
      imagen,
      estado,
    } = body

    // Verificar código único si se proporciona
    if (codigo) {
      const existente = await db.materiaPrima.findUnique({ where: { codigo } })
      if (existente) {
        return NextResponse.json(
          { error: 'Ya existe una materia prima con ese código' },
          { status: 400 }
        )
      }
    }

    const materiaPrima = await db.materiaPrima.create({
      data: {
        codigo: codigo || null,
        nombre,
        descripcion: descripcion || null,
        id_categoria: parseInt(id_categoria),
        id_unidad_base: parseInt(id_unidad_base),
        stock_actual: parseFloat(stock_actual) || 0,
        stock_minimo: parseFloat(stock_minimo) || 0,
        precio_compra_referencia: parseFloat(precio_compra_referencia) || 0,
        imagen: imagen || null,
        estado: estado !== false,
      },
      include: {
        categoria: true,
        unidadBase: true,
      },
    })

    return NextResponse.json(materiaPrima, { status: 201 })
  } catch (error) {
    console.error('Error al crear materia prima:', error)
    return NextResponse.json({ error: 'Error al crear materia prima' }, { status: 500 })
  }
}
