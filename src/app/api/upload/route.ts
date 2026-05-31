import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    const result = await uploadImage(file, 'general')

    return NextResponse.json({
      url: result.url,
      size: result.size,
    })
  } catch (err) {
    console.error('[Upload Error]', err)
    const message = err instanceof Error ? err.message : 'Error al subir la imagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
