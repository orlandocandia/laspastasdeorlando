import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/productos - Obtener productos (solo con stock=true para público)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const soloStock = searchParams.get('stock') !== 'false'
    const destacados = searchParams.get('destacados') === 'true'

    const where: Record<string, unknown> = {}
    if (soloStock) where.stock = true
    if (destacados) where.destacado = true

    const productos = await db.producto.findMany({
      where,
      orderBy: [{ destacado: 'desc' }, { nombre: 'asc' }],
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST /api/productos - Crear producto (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, categoria, precio, peso, imagen, stock, destacado } = body

    const producto = await db.producto.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        categoria,
        precio: parseFloat(precio),
        peso: peso || '500g',
        imagen: imagen || null,
        stock: stock !== false,
        destacado: destacado || false,
      },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}

// PUT /api/productos - Actualizar producto (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, orden, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // `orden` se ignora: ya no se usa para ordenamiento (usar destacado + alfabético)
    void orden

    const producto = await db.producto.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        precio: data.precio ? parseFloat(data.precio) : undefined,
      },
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

// DELETE /api/productos - Eliminar producto (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await db.producto.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Producto eliminado' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
