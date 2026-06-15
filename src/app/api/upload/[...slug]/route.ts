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

    // Log upload attempt for debugging
    console.log(`[Upload] Entity: ${entity}, File: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB, Type: ${file.type}`)

    const result = await uploadImage(file, entity)

    console.log(`[Upload] Success → ${result.url}`)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al subir imagen'
    console.error('[Upload API Error]', message)

    // Determine appropriate status code
    let status = 500
    if (message.includes('no permitido') || message.includes('Tipo de archivo')) {
      status = 400
    } else if (message.includes('supera el límite') || message.includes('5MB')) {
      status = 413
    } else if (message.includes('BLOB_READ_WRITE_TOKEN')) {
      status = 503 // Service Unavailable - config missing
    }

    return NextResponse.json({ error: message }, { status })
  }
}
