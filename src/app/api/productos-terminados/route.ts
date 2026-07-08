import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

/**
 * Calcula el dígito verificador de un código EAN-13
 * Fórmula: sumar dígitos en posiciones impares ×1 + posiciones pares ×3,
 * el check digit = (10 - (sum % 10)) % 10
 */
function calcularCheckDigitEAN13(digits12: string): string {
  const digits = digits12.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  return String((10 - (sum % 10)) % 10)
}

/**
 * Genera un código EAN-13 secuencial a partir de un contador
 * Formato: 779 + 9 dígitos + 1 check digit = 13 dígitos
 */
function generarCodigoEAN13(contador: number): string {
  const prefijo = '779'
  const numero = contador.toString().padStart(9, '0')
  const base = prefijo + numero
  const checkDigit = calcularCheckDigitEAN13(base)
  return base + checkDigit
}

/**
 * Genera el siguiente código EAN-13 secuencial único
 * Busca el último código existente que empiece con 779, incrementa y verifica unicidad
 */
async function generarSiguienteEAN13(): Promise<string> {
  // Buscar el último código de barras secuencial (que empiece con 779)
  const ultimo = await db.productoTerminado.findFirst({
    where: {
      codigo_barras: { not: null, startsWith: '779' },
    },
    orderBy: { codigo_barras: 'desc' },
    select: { codigo_barras: true },
  })

  let contador = 1
  if (ultimo?.codigo_barras) {
    const numeroStr = ultimo.codigo_barras.substring(3, 12)
    contador = parseInt(numeroStr, 10) + 1
  }

  // Intentar generar un código único (con reintentos por si hay colisión)
  let attempts = 0
  while (attempts < 50) {
    const ean13 = generarCodigoEAN13(contador)
    const existente = await db.productoTerminado.findUnique({ where: { codigo_barras: ean13 } })
    if (!existente) {
      return ean13
    }
    contador++
    attempts++
  }

  // Fallback extremo: usar timestamp
  const ts = Date.now().toString().slice(-9)
  const digits12 = `779${ts}`
  const checkDigit = calcularCheckDigitEAN13(digits12)
  return `${digits12}${checkDigit}`
}

// GET /api/productos-terminados - Listar productos terminados con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const id_categoria = searchParams.get('id_categoria')
    const estado = searchParams.get('estado')
    const incluir_inactivos = searchParams.get('incluir_inactivos') === 'true'
    const tipo_harina = searchParams.get('tipo_harina')
    const stock = searchParams.get('stock')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const where: Record<string, unknown> = {}
    const parsedCategoria = parseInt(id_categoria)
    if (id_categoria && !isNaN(parsedCategoria)) where.id_categoria = parsedCategoria
    // Solo aplicar el filtro de estado si NO se pidió incluir inactivos.
    // incluir_inactivos=true tiene prioridad sobre estado=true/false y devuelve
    // productos activos e inactivos (necesario para Ventas, Presupuestos, etc.
    // donde se puede vender un producto discontinuado que aún tiene stock).
    if (!incluir_inactivos && estado !== null && estado !== '' && estado !== 'all') {
      where.estado = estado === 'true'
    }
    if (tipo_harina && ['con_gluten', 'integral', 'sin_gluten'].includes(tipo_harina)) {
      where.tipo_harina = tipo_harina
    }
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar } },
        { codigo: { contains: buscar } },
        { codigo_barras: { contains: buscar } },
      ]
    }
    // Stock filter: sin_stock = stock_actual <= 0, stock_bajo = 0 < stock_actual <= stock_minimo
    if (stock === 'sin_stock') {
      where.stock_actual = { lte: 0 }
    }

    // For "stock_bajo" we need in-memory filtering (can't compare two columns in SQLite)
    const isStockBajoFilter = stock === 'stock_bajo'

    if (isStockBajoFilter) {
      // Fetch all matching items and filter in-memory
      const allItems = await db.productoTerminado.findMany({
        where,
        include: { categoria: true },
        orderBy: { nombre: 'asc' },
      })
      const filtered = allItems.filter(pt => pt.stock_actual > 0 && pt.stock_actual <= pt.stock_minimo)
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
      db.productoTerminado.findMany({
        where,
        include: {
          categoria: true,
        },
        orderBy: { nombre: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.productoTerminado.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener productos terminados:', error)
    return NextResponse.json({ error: 'Error al obtener productos terminados' }, { status: 500 })
  }
}

// POST /api/productos-terminados - Crear producto terminado
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const body = await request.json()
    const {
      codigo,
      codigo_barras,
      nombre,
      descripcion,
      id_categoria,
      tipo_harina,
      seccion,
      peso_unitario_aprox,
      unidades,
      precio_venta,
      stock_minimo,
      destacado,
      orden,
      visible_en_landing,
      imagen,
      modo_coccion,
      texto_frente,
      texto_reverso,
      estado,
    } = body

    // REGLA PERMANENTE: No se permite crear productos sin imagen válida
    if (!imagen || imagen.trim() === '' || imagen.toUpperCase() === 'N/A') {
      return NextResponse.json(
        { error: 'REGLA DE NEGOCIO: Todo producto terminado debe tener una imagen/foto válida. No se permiten productos sin imagen.' },
        { status: 400 }
      )
    }

    // Verificar código único si se proporciona
    if (codigo) {
      const existente = await db.productoTerminado.findUnique({ where: { codigo } })
      if (existente) {
        return NextResponse.json(
          { error: 'Ya existe un producto terminado con ese código' },
          { status: 400 }
        )
      }
    }

    // Auto-generar código de barras EAN-13 secuencial si no se proporciona
    let codigoBarrasFinal = codigo_barras || null
    if (!codigoBarrasFinal) {
      codigoBarrasFinal = await generarSiguienteEAN13()
    } else {
      // Verificar código de barras único si se proporciona manualmente
      const existenteCB = await db.productoTerminado.findUnique({ where: { codigo_barras: codigoBarrasFinal } })
      if (existenteCB) {
        return NextResponse.json(
          { error: 'Ya existe un producto terminado con ese código de barras' },
          { status: 400 }
        )
      }
    }

    // Validar seccion: solo se permiten valores nulos o "pastas"/"horneados"
    const seccionValidada =
      seccion === 'pastas' || seccion === 'horneados' ? seccion : null

    const productoTerminado = await db.productoTerminado.create({
      data: {
        codigo: codigo || null,
        codigo_barras: codigoBarrasFinal,
        nombre,
        descripcion: descripcion || null,
        id_categoria: parseInt(id_categoria),
        tipo_harina: tipo_harina || null,
        seccion: seccionValidada,
        peso_unitario_aprox: parseFloat(peso_unitario_aprox) || 0,
        unidades: unidades ? parseInt(unidades) : null,
        precio_venta: parseFloat(precio_venta) || 0,
        stock_minimo: parseFloat(stock_minimo) || 0,
        destacado: destacado === true,
        orden: parseInt(orden) || 0,
        visible_en_landing: visible_en_landing !== false,
        imagen: imagen || null,
        modo_coccion: modo_coccion || null,
        texto_frente: texto_frente || null,
        texto_reverso: texto_reverso || null,
        estado: estado !== false,
      },
      include: {
        categoria: true,
      },
    })

    return NextResponse.json(productoTerminado, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto terminado:', error)
    return NextResponse.json({ error: 'Error al crear producto terminado' }, { status: 500 })
  }
}
