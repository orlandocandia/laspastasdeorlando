import { NextResponse } from 'next/server'
import { getPlaceById, updatePlace, deletePlace, type CmPlaceInput } from '@/lib/cocina-movil/places'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const place = getPlaceById(id)
  if (!place) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
  return NextResponse.json({ place })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }

  const updates: Partial<CmPlaceInput> = {}
  for (const key of ['name', 'description', 'contactName', 'contactPhone', 'contactEmail', 'address', 'country', 'province', 'department', 'municipality', 'location', 'image']) {
    if (body[key] !== undefined) updates[key as keyof CmPlaceInput] = typeof body[key] === 'string' ? body[key] : null
  }
  if (body.isOwned !== undefined) updates.isOwned = !!body.isOwned
  if (body.rentCost !== undefined) updates.rentCost = typeof body.rentCost === 'number' ? body.rentCost : null
  if (body.utilityCost !== undefined) updates.utilityCost = typeof body.utilityCost === 'number' ? body.utilityCost : null
  if (body.otherFixedCosts !== undefined) updates.otherFixedCosts = typeof body.otherFixedCosts === 'number' ? body.otherFixedCosts : null
  if (body.isActive !== undefined) updates.isActive = !!body.isActive

  try {
    const place = updatePlace(id, updates)
    if (!place) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
    return NextResponse.json({ place })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = deletePlace(id)
  if (!ok) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Lugar eliminado' })
}
