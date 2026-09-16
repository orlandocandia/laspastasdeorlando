import { NextResponse } from 'next/server'
import { getSaleById, updateSale, deleteSale, type CmSaleInput } from '@/lib/cocina-movil/sales'
import { requireAdmin } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const sale = getSaleById(id)
  if (!sale) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ sale })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmSaleInput> = {}
  if (typeof body.placeId === 'string') updates.placeId = body.placeId
  if (body.clientName !== undefined) updates.clientName = typeof body.clientName === 'string' ? body.clientName : null
  if (body.invoiceNumber !== undefined) updates.invoiceNumber = typeof body.invoiceNumber === 'string' ? body.invoiceNumber : null
  if (body.paymentMethod !== undefined) updates.paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : 'Efectivo'
  if (typeof body.saleDate === 'number') updates.saleDate = body.saleDate
  if (body.observations !== undefined) updates.observations = typeof body.observations === 'string' ? body.observations : null
  if (Array.isArray(body.items)) {
    updates.items = (body.items as Array<Record<string, unknown>>).map((it) => ({
      recipeId: typeof it.recipeId === 'string' ? it.recipeId : '',
      quantity: typeof it.quantity === 'number' ? it.quantity : 0,
      unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : 0,
    }))
  }
  if (body.discountType !== undefined) updates.discountType = body.discountType === 'percentage' || body.discountType === 'fixed' ? body.discountType : null
  if (body.discountValue !== undefined) updates.discountValue = typeof body.discountValue === 'number' ? body.discountValue : null
  if (body.taxRate !== undefined) updates.taxRate = typeof body.taxRate === 'number' ? body.taxRate : null
  try {
    const sale = updateSale(id, updates)
    if (!sale) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ sale })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const ok = deleteSale(id)
  if (!ok) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminada' })
}
