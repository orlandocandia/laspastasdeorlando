import { NextResponse } from 'next/server'
import { getPurchaseOrderById, updatePurchaseOrder, deletePurchaseOrder, type CmPurchaseOrderInput } from '@/lib/cocina-movil/purchase-orders'
import { requireAdmin } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const order = getPurchaseOrderById(id)
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ order })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmPurchaseOrderInput> = {}
  if (typeof body.supplierId === 'string') updates.supplierId = body.supplierId
  if (typeof body.orderDate === 'number') updates.orderDate = body.orderDate
  if (body.expectedDeliveryDate !== undefined) updates.expectedDeliveryDate = typeof body.expectedDeliveryDate === 'number' ? body.expectedDeliveryDate : null
  if (body.observations !== undefined) updates.observations = typeof body.observations === 'string' ? body.observations : null
  if (Array.isArray(body.items)) {
    updates.items = (body.items as Array<Record<string, unknown>>).map((it) => ({
      itemType: it.itemType === 'supply' ? 'supply' as const : 'ingredient' as const,
      itemId: typeof it.itemId === 'string' ? it.itemId : '',
      quantity: typeof it.quantity === 'number' ? it.quantity : 0,
      unit: typeof it.unit === 'string' ? it.unit : 'u',
      pricePerUnit: typeof it.pricePerUnit === 'number' ? it.pricePerUnit : 0,
    }))
  }
  try {
    const order = updatePurchaseOrder(id, updates)
    if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ order })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  try {
    const ok = deletePurchaseOrder(id)
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, message: 'Eliminado' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 400 })
  }
}
