import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/insumos - Listar insumos con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const id_tipo_insumo = searchParams.get('id_tipo_insumo')
    const estado = searchParams.get('estado')
    const stock = searchParams.get('stock')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}
    if (id_tipo_insumo && !isNaN(parseInt(id_tipo_insumo))) where.id_tipo_insumo = parseInt(id_tipo_insumo)
    if (estado && estado !== 'all') where.estado = estado === 'true'
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
    const isStockBajoFilter = stock === 'stock_bajo'

    if (isStockBajoFilter) {
      const allItems = await db.insumo.findMany({
        where,
        include: { tipoInsumo: true, unidadBase: true },
        orderBy: { nombre: 'asc' },
      })
      const filtered = allItems.filter(ins => ins.stock_actual > 0 && ins.stock_actual <= ins.stock_minimo)
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
      db.insumo.findMany({
        where,
        include: {
          tipoInsumo: true,
          unidadBase: true,
        },
        orderBy: { nombre: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.insumo.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener insumos:', error)
    return NextResponse.json({ error: 'Error al obtener insumos' }, { status: 500 })
  }
}

// POST /api/insumos - Crear insumo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      codigo,
      nombre,
      descripcion,
      id_tipo_insumo,
      id_unidad_base,
      stock_actual,
      stock_minimo,
      precio_compra_referencia,
      imagen,
      estado,
    } = body

    // Verificar código único si se proporciona
    if (codigo) {
      const existente = await db.insumo.findUnique({ where: { codigo } })
      if (existente) {
        return NextResponse.json(
          { error: 'Ya existe un insumo con ese código' },
          { status: 400 }
        )
      }
    }

    const insumo = await db.insumo.create({
      data: {
        codigo: codigo || null,
        nombre,
        descripcion: descripcion || null,
        id_tipo_insumo: parseInt(id_tipo_insumo),
        id_unidad_base: parseInt(id_unidad_base),
        stock_actual: parseFloat(stock_actual) || 0,
        stock_minimo: parseFloat(stock_minimo) || 0,
        precio_compra_referencia: parseFloat(precio_compra_referencia) || 0,
        imagen: imagen || null,
        estado: estado !== false,
      },
      include: {
        tipoInsumo: true,
        unidadBase: true,
      },
    })

    return NextResponse.json(insumo, { status: 201 })
  } catch (error) {
    console.error('Error al crear insumo:', error)
    return NextResponse.json({ error: 'Error al crear insumo' }, { status: 500 })
  }
}
