import { NextResponse } from 'next/server'
import { getBudgetById, setBudgetStatus } from '@/lib/cocina-movil/budgets'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }

  const budget = getBudgetById(id)
  if (!budget) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })

  // If saleId is provided, just link it
  if (typeof body.saleId === 'string' && body.saleId) {
    // Mark budget as approved + link sale
    setBudgetStatus(budget.id, 'aprobado')
    return NextResponse.json({ ok: true, budgetId: budget.id, saleId: body.saleId })
  }

  return NextResponse.json({ error: 'Se requiere saleId.' }, { status: 400 })
}
