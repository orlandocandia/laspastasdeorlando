import { NextResponse } from 'next/server'
import { setPlaceStatus } from '@/lib/cocina-movil/places'

export const runtime = 'nodejs'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: { isActive?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.isActive !== 'boolean') return NextResponse.json({ error: 'isActive debe ser boolean.' }, { status: 400 })
  const place = setPlaceStatus(id, body.isActive)
  if (!place) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
  return NextResponse.json({ place })
}
