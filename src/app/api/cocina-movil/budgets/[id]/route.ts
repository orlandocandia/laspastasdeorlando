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
  if (typeof body.recipeId === 'string') updates.recipeId = body.recipeId
  if (body.clientName !== undefined) updates.clientName = typeof body.clientName === 'string' ? body.clientName : null
  if (typeof body.servings === 'number') updates.servings = body.servings
  if (typeof body.pricePerServing === 'number') updates.pricePerServing = body.pricePerServing
  if (body.observations !== undefined) updates.observations = typeof body.observations === 'string' ? body.observations : null
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
