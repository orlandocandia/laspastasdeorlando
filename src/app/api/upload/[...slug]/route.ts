import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/upload'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/upload/[...slug] — Subir imagen genérica
// slug determina la entidad: producto-terminado, materia-prima, insumo, persona, etc.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const { slug } = await params
    // slug es un array: ["producto-terminado"] → lo unimos
    const entity = slug.join('/')

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    const result = await uploadImage(file, entity)

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al subir imagen'
    console.error('[Upload API Error]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
