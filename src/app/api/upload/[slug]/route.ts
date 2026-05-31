import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/upload'

const ENTIDADES_PERMITIDAS = [
  'producto-terminado',
  'materia-prima',
  'insumo',
  'persona',
  'usuario',
  'producto',
  'categoria',
  'general',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Validate entity slug
    const entidad = slug || 'general'
    if (!ENTIDADES_PERMITIDAS.includes(entidad)) {
      return NextResponse.json(
        { error: `Entidad no permitida: ${entidad}` },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    const result = await uploadImage(file, entidad)

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
