import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) return NextResponse.json({ error: 'No se envió archivo.' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Debe ser una imagen.' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Máx 5MB.' }, { status: 400 })
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Blob no configurado.' }, { status: 500 })

    let put: (filename: string, data: Blob, options: { access: 'public'; token?: string }) => Promise<{ url: string }>
    try { put = (await import('@vercel/blob')).put } catch { return NextResponse.json({ error: 'Módulo blob no disponible.' }, { status: 500 }) }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `cocina-movil/places/place-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const blob = await put(filename, file, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN })
    console.log('[CocinaMóvil-Places] Imagen subida:', blob.url)
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error.' }, { status: 500 })
  }
}
