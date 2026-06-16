import { NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'

export async function GET(req: Request) {
  try {
    // Ensure Turso auto-migration has completed before querying
    await ensureDbReady()

    const { searchParams } = new URL(req.url)
    const codigo = searchParams.get('codigo')

    if (!codigo) {
      return NextResponse.json(
        { error: 'Parámetro "codigo" requerido' },
        { status: 400 }
      )
    }

    // Buscar por código de barras exacto
    let producto = await db.productoTerminado.findUnique({
      where: { codigo_barras: codigo },
      include: {
        categoria: { select: { id: true, nombre: true } },
      },
    })

    // Si no encuentra por código de barras, buscar por código interno
    if (!producto) {
      producto = await db.productoTerminado.findUnique({
        where: { codigo },
        include: {
          categoria: { select: { id: true, nombre: true } },
        },
      })
    }

    // Si aún no encuentra, buscar por nombre (búsqueda parcial)
    if (!producto) {
      const porNombre = await db.productoTerminado.findMany({
        where: {
          nombre: { contains: codigo },
          estado: true,
        },
        include: {
          categoria: { select: { id: true, nombre: true } },
        },
        take: 10,
      })

      if (porNombre.length === 1) {
        return NextResponse.json(porNombre[0])
      }
      if (porNombre.length > 1) {
        return NextResponse.json({ multiples: porNombre })
      }
    }

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('[BUSCAR_POR_CODIGO]', error)
    return NextResponse.json(
      { error: 'Error al buscar producto' },
      { status: 500 }
    )
  }
}
