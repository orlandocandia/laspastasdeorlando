import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { uploadImage } from '@/lib/upload'

// Allowed entity slugs. Maps the URL slug → the entity key used by lib/upload.ts.
// This prevents arbitrary path injection.
const ALLOWED_ENTITIES: Record<string, string> = {
  'producto-terminado': 'producto-terminado',
  'materia-prima': 'materia-prima',
  'insumo': 'insumo',
  'persona': 'persona',
  'usuario': 'usuario',
  'categoria': 'categoria',
  'producto': 'producto',
}

/**
 * POST /api/upload/[...slug]
 *
 * Receives a multipart/form-data with a `file` field and stores it using
 * Vercel Blob Storage (production) or local filesystem (development).
 *
 * Path examples:
 *   POST /api/upload/producto-terminado
 *   POST /api/upload/materia-prima
 *   POST /api/upload/categoria
 *
 * Returns: { url: string, size: number }
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate (admin-only)
  const auth = await requireAuth()
  if (!auth.authorized) {
    return auth.response!
  }

  // 2. Extract entity from the URL path
  //    request.url = http://host/api/upload/producto-terminado
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  // pathSegments = ['api', 'upload', 'producto-terminado']
  const entitySlug = pathSegments[2] // 'producto-terminado' or undefined

  const entity = entitySlug ? ALLOWED_ENTITIES[entitySlug] : undefined
  if (entitySlug && !entity) {
    return NextResponse.json(
      { error: `Entidad de upload no permitida: ${entitySlug}` },
      { status: 400 }
    )
  }

  // 3. Parse multipart form
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

  // 4. Upload (Vercel Blob in prod, local fs in dev)
  try {
    const result = await uploadImage(file, entity)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al subir imagen'

    // Distinguish known error types for better client UX
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
