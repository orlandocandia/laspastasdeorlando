import { NextResponse } from 'next/server'
import { getClientOrderById, updateClientOrder, deleteClientOrder, type CmClientOrderInput } from '@/lib/cocina-movil/client-orders'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const order = getClientOrderById(id)
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ order })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmClientOrderInput> = {}
  if (body.clientName !== undefined) updates.clientName = typeof body.clientName === 'string' ? body.clientName : null
  if (body.clientPhone !== undefined) updates.clientPhone = typeof body.clientPhone === 'string' ? body.clientPhone : null
  if (body.clientEmail !== undefined) updates.clientEmail = typeof body.clientEmail === 'string' ? body.clientEmail : null
  if (typeof body.orderDate === 'number') updates.orderDate = body.orderDate
  if (body.expectedDeliveryDate !== undefined) updates.expectedDeliveryDate = typeof body.expectedDeliveryDate === 'number' ? body.expectedDeliveryDate : null
  if (body.observations !== undefined) updates.observations = typeof body.observations === 'string' ? body.observations : null
  if (Array.isArray(body.items)) {
    updates.items = (body.items as Array<Record<string, unknown>>).map((it) => ({
      recipeId: typeof it.recipeId === 'string' ? it.recipeId : '',
      quantity: typeof it.quantity === 'number' ? it.quantity : 0,
      unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : 0,
    }))
  }
  try {
    const order = updateClientOrder(id, updates)
    if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ order })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  try {
    const ok = deleteClientOrder(id)
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, message: 'Eliminado' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 400 })
  }
}
