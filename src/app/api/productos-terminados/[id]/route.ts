import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/productos-terminados/[id] - Obtener producto terminado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const { id } = await params
    const productoTerminado = await db.productoTerminado.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        recetas: {
          where: { activo: true },
          include: {
            detalleRecetas: {
              include: {
                materiaPrima: { select: { id: true, nombre: true, precio_compra_referencia: true } },
                insumo: { select: { id: true, nombre: true, precio_compra_referencia: true } },
                unidad: { select: { id: true, codigo: true, nombre: true } },
              },
            },
          },
        },
      },
    })

    if (!productoTerminado) {
      return NextResponse.json({ error: 'Producto terminado no encontrado' }, { status: 404 })
    }

    // Calculate cost from the first active recipe
    const recetaActiva = productoTerminado.recetas?.[0]
    let costoProduccion = 0
    let costoMP = 0
    let costoInsumos = 0
    if (recetaActiva) {
      costoMP = recetaActiva.detalleRecetas
        .filter(d => d.materiaPrima)
        .reduce((sum, d) => sum + d.costo_estimado, 0)
      costoInsumos = recetaActiva.detalleRecetas
        .filter(d => d.insumo)
        .reduce((sum, d) => sum + d.costo_estimado, 0)
      costoProduccion = recetaActiva.rendimiento_unidades > 0
        ? (costoMP + costoInsumos) / recetaActiva.rendimiento_unidades
        : 0
    }
    const margen = productoTerminado.precio_venta - costoProduccion
    const margenPorcentaje = productoTerminado.precio_venta > 0
      ? (margen / productoTerminado.precio_venta) * 100
      : 0

    // Return with computed fields
    return NextResponse.json({
      ...productoTerminado,
      costo_produccion: Math.round(costoProduccion * 100) / 100,
      margen: Math.round(margen * 100) / 100,
      margen_porcentaje: Math.round(margenPorcentaje * 100) / 100,
      costo_mp: Math.round(costoMP * 100) / 100,
      costo_insumos: Math.round(costoInsumos * 100) / 100,
      receta_activa: recetaActiva || null,
    })
  } catch (error) {
    console.error('Error al obtener producto terminado:', error)
    return NextResponse.json({ error: 'Error al obtener producto terminado' }, { status: 500 })
  }
}

// PUT /api/productos-terminados/[id] - Actualizar producto terminado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const { id } = await params
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

    // REGLA PERMANENTE: No se permite actualizar un producto quitándole la imagen
    if (imagen !== undefined) {
      if (!imagen || imagen.trim() === '' || imagen.toUpperCase() === 'N/A') {
        return NextResponse.json(
          { error: 'REGLA DE NEGOCIO: No se puede quitar la imagen de un producto. Todo producto debe tener una foto válida.' },
          { status: 400 }
        )
      }
    }

    // Verificar código único (excluyendo el registro actual)
    if (codigo) {
      const existente = await db.productoTerminado.findFirst({
        where: {
          codigo,
          id: { not: parseInt(id) },
        },
      })
      if (existente) {
        return NextResponse.json(
          { error: 'Ya existe otro producto terminado con ese código' },
          { status: 400 }
        )
      }
    }

    // Verificar código de barras único (excluyendo el registro actual)
    if (codigo_barras) {
      const existenteCB = await db.productoTerminado.findFirst({
        where: {
          codigo_barras,
          id: { not: parseInt(id) },
        },
      })
      if (existenteCB) {
        return NextResponse.json(
          { error: 'Ya existe otro producto terminado con ese código de barras' },
          { status: 400 }
        )
      }
    }

    // Validar seccion: solo se permiten valores nulos o "pastas"/"horneados"
    // Si seccion es undefined, no se actualiza. Si es null o inválido, se guarda como null.
    let seccionParaGuardar: string | null | undefined = undefined
    if (seccion !== undefined) {
      seccionParaGuardar =
        seccion === 'pastas' || seccion === 'horneados' ? seccion : null
    }

    const productoTerminado = await db.productoTerminado.update({
      where: { id: parseInt(id) },
      data: {
        codigo: codigo !== undefined ? codigo || null : undefined,
        codigo_barras: codigo_barras !== undefined ? codigo_barras || null : undefined,
        nombre: nombre || undefined,
        descripcion: descripcion !== undefined ? descripcion || null : undefined,
        id_categoria: id_categoria ? parseInt(id_categoria) : undefined,
        tipo_harina: tipo_harina !== undefined ? tipo_harina || null : undefined,
        seccion: seccionParaGuardar,
        peso_unitario_aprox: peso_unitario_aprox !== undefined ? parseFloat(peso_unitario_aprox) : undefined,
        unidades: unidades !== undefined ? (unidades ? parseInt(unidades) : null) : undefined,
        precio_venta: precio_venta !== undefined ? parseFloat(precio_venta) : undefined,
        stock_minimo: stock_minimo !== undefined ? parseFloat(stock_minimo) : undefined,
        destacado: destacado !== undefined ? destacado : undefined,
        orden: orden !== undefined ? parseInt(orden) : undefined,
        visible_en_landing: visible_en_landing !== undefined ? visible_en_landing : undefined,
        imagen: imagen !== undefined ? imagen || null : undefined,
        modo_coccion: modo_coccion !== undefined ? modo_coccion || null : undefined,
        texto_frente: texto_frente !== undefined ? texto_frente || null : undefined,
        texto_reverso: texto_reverso !== undefined ? texto_reverso || null : undefined,
        estado: estado !== undefined ? estado : undefined,
      },
      include: {
        categoria: true,
      },
    })

    return NextResponse.json(productoTerminado)
  } catch (error) {
    console.error('Error al actualizar producto terminado:', error)
    return NextResponse.json({ error: 'Error al actualizar producto terminado' }, { status: 500 })
  }
}

// DELETE /api/productos-terminados/[id] - Desactivar producto terminado (borrado lógico)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const { id } = await params

    const productoTerminado = await db.productoTerminado.findUnique({
      where: { id: parseInt(id) },
    })

    if (!productoTerminado) {
      return NextResponse.json({ error: 'Producto terminado no encontrado' }, { status: 404 })
    }

    // Soft delete: marcar como inactivo en vez de eliminar
    await db.productoTerminado.update({
      where: { id: parseInt(id) },
      data: { estado: false },
    })

    return NextResponse.json({ message: 'Producto terminado desactivado' })
  } catch (error) {
    console.error('Error al desactivar producto terminado:', error)
    return NextResponse.json({ error: 'Error al desactivar producto terminado' }, { status: 500 })
  }
}
