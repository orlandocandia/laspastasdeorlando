import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/upload'

// ---------------------------------------------------------------------------
// Allowed entity slugs — must match ENTITY_SUBDIRS in src/lib/upload.ts
// ---------------------------------------------------------------------------
const ALLOWED_ENTITIES = [
  'categoria',
  'producto-terminado',
  'materia-prima',
  'insumo',
  'persona',
  'usuario',
  'producto',
] as const

type AllowedEntity = (typeof ALLOWED_ENTITIES)[number]

// ---------------------------------------------------------------------------
// POST /api/upload/[...slug] — Upload an image for a given entity
// ---------------------------------------------------------------------------
// Accepts FormData with a `file` field.
// The slug determines the subdirectory (e.g. /api/upload/categoria → categorias/)
// Returns { url, size } on success.
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params

    // Build entity from slug array (e.g. ['producto-terminado'] → 'producto-terminado')
    const entity = slug.join('-')

    // Validate entity
    if (!ALLOWED_ENTITIES.includes(entity as AllowedEntity)) {
      return NextResponse.json(
        { error: `Entidad no permitida: "${entity}". Permitidas: ${ALLOWED_ENTITIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró el archivo. Envía un campo "file" en el FormData.' },
        { status: 400 }
      )
    }

    // Upload using shared utility (Vercel Blob in production, local filesystem in dev)
    const result = await uploadImage(file, entity)

    console.log(`[Upload] ✅ ${entity}/${file.name} → ${result.url} (${(result.size / 1024).toFixed(1)}KB)`)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al subir archivo'
    console.error('[Upload] ❌', message)

    // Distinguish validation errors from server errors
    const isValidationError =
      message.includes('no permitido') ||
      message.includes('supera el límite')

    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
