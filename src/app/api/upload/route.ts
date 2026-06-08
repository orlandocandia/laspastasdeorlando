import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/upload'

// ---------------------------------------------------------------------------
// POST /api/upload — Upload an image without specifying entity
// ---------------------------------------------------------------------------
// Fallback route used by the generic ImageUploader component.
// Saves to 'general' subdirectory.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró el archivo. Envía un campo "file" en el FormData.' },
        { status: 400 }
      )
    }

    // Upload without entity → 'general' subdirectory
    const result = await uploadImage(file)

    console.log(`[Upload] ✅ general/${file.name} → ${result.url} (${(result.size / 1024).toFixed(1)}KB)`)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al subir archivo'
    console.error('[Upload] ❌', message)

    const isValidationError =
      message.includes('no permitido') ||
      message.includes('supera el límite')

    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
