import { NextResponse } from 'next/server'
import { getPurchaseById, updatePurchase, deletePurchase, type CmPurchaseInput } from '@/lib/cocina-movil/purchases'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const purchase = getPurchaseById(id)
  if (!purchase) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ purchase })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }

  const updates: Partial<CmPurchaseInput> = {}
  if (typeof body.supplierId === 'string') updates.supplierId = body.supplierId
  if (body.placeId !== undefined) updates.placeId = typeof body.placeId === 'string' ? body.placeId : null
  if (typeof body.purchaseDate === 'number') updates.purchaseDate = body.purchaseDate
  if (body.invoiceNumber !== undefined) updates.invoiceNumber = typeof body.invoiceNumber === 'string' ? body.invoiceNumber : null
  if (body.observations !== undefined) updates.observations = typeof body.observations === 'string' ? body.observations : null
  if (Array.isArray(body.items)) {
    updates.items = body.items.map((item: Record<string, unknown>) => ({
      itemType: item.itemType === 'supply' ? 'supply' as const : 'ingredient' as const,
      itemId: typeof item.itemId === 'string' ? item.itemId : '',
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      unit: typeof item.unit === 'string' ? item.unit : 'kg',
      pricePerUnit: typeof item.pricePerUnit === 'number' ? item.pricePerUnit : 0,
    }))
  }

  try {
    const purchase = updatePurchase(id, updates)
    if (!purchase) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ purchase })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = deletePurchase(id)
  if (!ok) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminada' })
}
