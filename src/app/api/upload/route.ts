import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { uploadImage } from '@/lib/upload'

/**
 * POST /api/upload
 *
 * Legacy endpoint that accepts a single `file` field and stores it under
 * the "general" entity subdirectory. New code should use
 * /api/upload/{entity} (handled by the [...slug] catch-all route).
 *
 * Returns: { url: string, size: number }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return auth.response!
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Se esperaba multipart/form-data con un campo "file"' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'No se encontró el archivo en el campo "file"' },
      { status: 400 }
    )
  }

  try {
    const result = await uploadImage(file, 'producto')
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al subir imagen'

    if (errorMessage.includes('Tipo de archivo no permitido')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    if (errorMessage.includes('supera el límite')) {
      return NextResponse.json({ error: errorMessage }, { status: 413 })
    }
    if (errorMessage.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json({ error: errorMessage }, { status: 503 })
    }

    console.error('[Upload API Error]', errorMessage)
    return NextResponse.json(
      { error: errorMessage || 'Error interno al subir la imagen' },
      { status: 500 }
    )
  }
}
