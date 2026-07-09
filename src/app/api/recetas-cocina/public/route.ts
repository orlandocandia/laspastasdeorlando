import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/recetas-cocina/public - Recetas visibles en landing page (sin auth)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const destacado = searchParams.get('destacado')

    const where: Record<string, unknown> = {
      visible_en_landing: true,
    }
    if (categoria && categoria !== 'all') where.categoria = categoria
    if (destacado === 'true') where.destacado = true

    const recetas = await db.recetaCocina.findMany({
      where,
      orderBy: [
        { destacado: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        ingredientes: true,
        pasos: true,
        tiempo_preparacion: true,
        tiempo_coccion: true,
        dificultad: true,
        imagen: true,
        categoria: true,
        destacado: true,
        createdAt: true,
      },
    })

    return NextResponse.json(recetas)
  } catch (error) {
    console.error('Error al obtener recetas públicas:', error)
    return NextResponse.json({ error: 'Error al obtener recetas' }, { status: 500 })
  }
}
