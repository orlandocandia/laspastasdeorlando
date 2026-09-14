import { NextResponse } from 'next/server'
import { getBudgetById, updateBudget, deleteBudget, type CmBudgetInput } from '@/lib/cocina-movil/budgets'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const budget = getBudgetById(id)
  if (!budget) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ budget })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmBudgetInput> = {}
  if (body.clientName !== undefined) updates.clientName = typeof body.clientName === 'string' ? body.clientName : null
  if (typeof body.budgetDate === 'number') updates.budgetDate = body.budgetDate
  if (body.validityDays !== undefined) updates.validityDays = typeof body.validityDays === 'number' ? body.validityDays : null
  if (body.budgetNumber !== undefined) updates.budgetNumber = typeof body.budgetNumber === 'string' ? body.budgetNumber : null
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
    const budget = updateBudget(id, updates)
    if (!budget) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ budget })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  try {
    const ok = deleteBudget(id)
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, message: 'Eliminado' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 400 })
  }
}
