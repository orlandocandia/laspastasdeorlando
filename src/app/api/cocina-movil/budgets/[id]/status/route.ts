import { NextResponse } from 'next/server'
import { setBudgetStatus, type CmBudgetStatus } from '@/lib/cocina-movil/budgets'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: { status?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const validStatuses: CmBudgetStatus[] = ['borrador', 'enviado', 'aprobado', 'rechazado']
  if (!validStatuses.includes(body.status as CmBudgetStatus)) return NextResponse.json({ error: 'Estado inválido. Usar: borrador, enviado, aprobado, o rechazado.' }, { status: 400 })
  const budget = setBudgetStatus(id, body.status as CmBudgetStatus)
  if (!budget) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ budget })
}
