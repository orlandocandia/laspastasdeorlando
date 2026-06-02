import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/upload'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/upload - Subir imagen genérica
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    const result = await uploadImage(file)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir imagen' },
      { status: 500 }
    )
  }
}
