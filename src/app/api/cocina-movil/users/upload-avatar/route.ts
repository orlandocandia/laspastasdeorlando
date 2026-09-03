/**
 * ============================================================
 * API — Subir avatar de usuario a Vercel Blob
 * ============================================================
 * POST /api/cocina-movil/users/upload-avatar
 *
 * Body: multipart/form-data with field "file" (image)
 * Response 200: { url: string }
 * Response 400: { error: string }
 *
 * Usa @vercel/blob (instalado en el sistema principal).
 * Requiere BLOB_READ_WRITE_TOKEN en variables de entorno.
 * ============================================================
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No se envió ningún archivo.' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen (JPG, PNG, GIF, WebP).' },
        { status: 400 }
      )
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Verificar token de Vercel Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[CocinaMóvil-Avatar] BLOB_READ_WRITE_TOKEN no configurado')
      return NextResponse.json(
        { error: 'El almacenamiento de imágenes no está configurado.' },
        { status: 500 }
      )
    }

    // Import dinámico de @vercel/blob (puede no estar disponible en local dev)
    let put: (filename: string, data: Blob, options: { access: 'public'; token?: string }) => Promise<{ url: string }>
    try {
      const mod = await import('@vercel/blob')
      put = mod.put
    } catch {
      console.error('[CocinaMóvil-Avatar] @vercel/blob no disponible')
      return NextResponse.json(
        { error: 'Módulo de almacenamiento no disponible.' },
        { status: 500 }
      )
    }

    // Generar nombre único para el archivo
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `cocina-movil/avatars/avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    console.log('[CocinaMóvil-Avatar] Subiendo imagen:', filename, `(${file.size} bytes)`)

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('[CocinaMóvil-Avatar] ✅ Imagen subida:', blob.url)

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[CocinaMóvil-Avatar] ❌ Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al subir la imagen.' },
      { status: 500 }
    )
  }
}
