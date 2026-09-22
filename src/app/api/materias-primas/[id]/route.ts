import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/materias-primas/[id] - Obtener materia prima por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const materiaPrima = await db.materiaPrima.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        unidadBase: true,
      },
    })

    if (!materiaPrima) {
      return NextResponse.json({ error: 'Materia prima no encontrada' }, { status: 404 })
    }

    return NextResponse.json(materiaPrima)
  } catch (error) {
    console.error('Error al obtener materia prima:', error)
    return NextResponse.json({ error: 'Error al obtener materia prima' }, { status: 500 })
  }
}

// PUT /api/materias-primas/[id] - Actualizar materia prima
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      // Sistema de cálculo automático
      purchaseUnitType,
      unitsPurchased,
      weightPerUnit,
      weightUnit,
      totalPrice,
      pricePerUnit,
      totalGrams,
      imagen,
      estado,
    } = body

    // Verificar código único (excluyendo el registro actual)
    if (codigo) {
      const existente = await db.materiaPrima.findFirst({
        where: {
          codigo,
          id: { not: parseInt(id) },
        },
      })
      if (existente) {
        return NextResponse.json(
          { error: 'Ya existe otra materia prima con ese código' },
          { status: 400 }
        )
      }
    }

    const materiaPrima = await db.materiaPrima.update({
      where: { id: parseInt(id) },
      data: {
        codigo: codigo !== undefined ? codigo || null : undefined,
        nombre: nombre || undefined,
        descripcion: descripcion !== undefined ? descripcion || null : undefined,
        id_categoria: id_categoria ? parseInt(id_categoria) : undefined,
        id_unidad_base: id_unidad_base ? parseInt(id_unidad_base) : undefined,
        stock_actual: stock_actual !== undefined ? parseFloat(stock_actual) : undefined,
        stock_minimo: stock_minimo !== undefined ? parseFloat(stock_minimo) : undefined,
        // Sincronizar precio_compra_referencia con pricePerUnit
        precio_compra_referencia: pricePerUnit !== undefined ? parseFloat(pricePerUnit) : (precio_compra_referencia !== undefined ? parseFloat(precio_compra_referencia) : undefined),
        // Sistema de cálculo automático
        purchaseUnitType: purchaseUnitType !== undefined ? purchaseUnitType || null : undefined,
        unitsPurchased: unitsPurchased !== undefined ? (unitsPurchased !== null ? parseFloat(unitsPurchased) : null) : undefined,
        weightPerUnit: weightPerUnit !== undefined ? (weightPerUnit !== null ? parseFloat(weightPerUnit) : null) : undefined,
        weightUnit: weightUnit !== undefined ? weightUnit || null : undefined,
        totalPrice: totalPrice !== undefined ? (totalPrice !== null ? parseFloat(totalPrice) : null) : undefined,
        pricePerUnit: pricePerUnit !== undefined ? (pricePerUnit !== null ? parseFloat(pricePerUnit) : null) : undefined,
        totalGrams: totalGrams !== undefined ? (totalGrams !== null ? parseFloat(totalGrams) : null) : undefined,
        imagen: imagen !== undefined ? imagen || null : undefined,
        estado: estado !== undefined ? estado : undefined,
      },
      include: {
        categoria: true,
        unidadBase: true,
      },
    })

    return NextResponse.json(materiaPrima)
  } catch (error) {
    console.error('Error al actualizar materia prima:', error)
    return NextResponse.json({ error: 'Error al actualizar materia prima' }, { status: 500 })
  }
}

// DELETE /api/materias-primas/[id] - Eliminar materia prima
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const materiaPrima = await db.materiaPrima.findUnique({
      where: { id: parseInt(id) },
    })

    if (!materiaPrima) {
      return NextResponse.json({ error: 'Materia prima no encontrada' }, { status: 404 })
    }

    await db.materiaPrima.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ message: 'Materia prima eliminada' })
  } catch (error) {
    console.error('Error al eliminar materia prima:', error)
    return NextResponse.json({ error: 'Error al eliminar materia prima' }, { status: 500 })
  }
}
