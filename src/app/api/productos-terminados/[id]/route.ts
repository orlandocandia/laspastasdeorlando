import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/productos-terminados/[id] - Obtener producto terminado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productoTerminado = await db.productoTerminado.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
      },
    })

    if (!productoTerminado) {
      return NextResponse.json({ error: 'Producto terminado no encontrado' }, { status: 404 })
    }

    return NextResponse.json(productoTerminado)
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
    const { id } = await params
    const body = await request.json()
    const {
      codigo,
      codigo_barras,
      nombre,
      descripcion,
      id_categoria,
      tipo_harina,
      peso_unitario_aprox,
      unidades,
      precio_venta,
      stock_minimo,
      destacado,
      orden,
      visible_en_landing,
      imagen,
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

    const productoTerminado = await db.productoTerminado.update({
      where: { id: parseInt(id) },
      data: {
        codigo: codigo !== undefined ? codigo || null : undefined,
        codigo_barras: codigo_barras !== undefined ? codigo_barras || null : undefined,
        nombre: nombre || undefined,
        descripcion: descripcion !== undefined ? descripcion || null : undefined,
        id_categoria: id_categoria ? parseInt(id_categoria) : undefined,
        tipo_harina: tipo_harina !== undefined ? tipo_harina || null : undefined,
        peso_unitario_aprox: peso_unitario_aprox !== undefined ? parseFloat(peso_unitario_aprox) : undefined,
        unidades: unidades !== undefined ? (unidades ? parseInt(unidades) : null) : undefined,
        precio_venta: precio_venta !== undefined ? parseFloat(precio_venta) : undefined,
        stock_minimo: stock_minimo !== undefined ? parseFloat(stock_minimo) : undefined,
        destacado: destacado !== undefined ? destacado : undefined,
        orden: orden !== undefined ? parseInt(orden) : undefined,
        visible_en_landing: visible_en_landing !== undefined ? visible_en_landing : undefined,
        imagen: imagen !== undefined ? imagen || null : undefined,
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
