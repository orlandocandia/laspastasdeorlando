import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/documentos/historial — Listar documentos generados con filtros y paginación
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const entidad_tipo = searchParams.get('entidad_tipo')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: Record<string, unknown> = {}
    if (tipo && tipo !== 'all') where.tipo = tipo
    if (entidad_tipo && entidad_tipo !== 'all') where.entidad_tipo = entidad_tipo

    const [data, total] = await Promise.all([
      db.documentoGenerado.findMany({
        where,
        include: {
          usuario: {
            select: { id: true, email: true, persona: { select: { nombre: true, apellido: true } } },
          },
        },
        orderBy: { fecha: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      db.documentoGenerado.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Error al obtener historial de documentos:', error)
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })
  }
}

// POST /api/documentos/historial — Registrar un documento generado (desde client-side)
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const { tipo, entidad_id, entidad_tipo, formato, email_enviado, destinatario, metadata } = body

    if (!tipo || !entidad_id || !entidad_tipo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: tipo, entidad_id, entidad_tipo' },
        { status: 400 }
      )
    }

    const doc = await db.documentoGenerado.create({
      data: {
        tipo,
        entidad_id: parseInt(entidad_id),
        entidad_tipo,
        formato: formato || 'pdf',
        generado_por: auth.session?.user?.id ? parseInt(auth.session.user.id) : null,
        email_enviado: email_enviado || false,
        destinatario: destinatario || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return NextResponse.json({ ok: true, id: doc.id }, { status: 201 })
  } catch (error) {
    console.error('Error al registrar documento generado:', error)
    return NextResponse.json({ error: 'Error al registrar documento' }, { status: 500 })
  }
}
