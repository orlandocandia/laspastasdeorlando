import { NextResponse } from 'next/server'
import { getProductionById, updateProduction, deleteProduction, type CmProductionInput } from '@/lib/cocina-movil/productions'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const prod = getProductionById(id)
  if (!prod) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ production: prod })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmProductionInput> = {}
  if (typeof body.recipeId === 'string') updates.recipeId = body.recipeId
  if (typeof body.placeId === 'string') updates.placeId = body.placeId
  if (body.cookId !== undefined) updates.cookId = typeof body.cookId === 'string' ? body.cookId : null
  if (body.cookName !== undefined) updates.cookName = typeof body.cookName === 'string' ? body.cookName : null
  if (typeof body.quantity === 'number') updates.quantity = body.quantity
  if (body.observations !== undefined) updates.observations = typeof body.observations === 'string' ? body.observations : null
  try {
    const prod = updateProduction(id, updates)
    if (!prod) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ production: prod })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const ok = deleteProduction(id)
    if (!ok) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ ok: true, message: 'Eliminada' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 400 })
  }
}
