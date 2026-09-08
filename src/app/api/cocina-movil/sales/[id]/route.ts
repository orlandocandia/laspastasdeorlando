import { NextResponse } from 'next/server'
import { getSaleById, updateSale, deleteSale, type CmSaleInput } from '@/lib/cocina-movil/sales'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const sale = getSaleById(id)
  if (!sale) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ sale })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmSaleInput> = {}
  if (typeof body.recipeId === 'string') updates.recipeId = body.recipeId
  if (typeof body.placeId === 'string') updates.placeId = body.placeId
  if (body.clientName !== undefined) updates.clientName = typeof body.clientName === 'string' ? body.clientName : null
  if (typeof body.quantity === 'number') updates.quantity = body.quantity
  if (typeof body.unitPrice === 'number') updates.unitPrice = body.unitPrice
  if (typeof body.saleDate === 'number') updates.saleDate = body.saleDate
  if (body.observations !== undefined) updates.observations = typeof body.observations === 'string' ? body.observations : null
  if (body.paymentMethod !== undefined) updates.paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : 'Efectivo'
  try {
    const sale = updateSale(id, updates)
    if (!sale) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ sale })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const ok = deleteSale(id)
  if (!ok) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminada' })
}
