import { NextResponse } from 'next/server'
import { setBudgetStatus, type CmBudgetStatus } from '@/lib/cocina-movil/budgets'
export const runtime = 'nodejs'
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: { status?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const validStatuses: CmBudgetStatus[] = ['borrador', 'enviado', 'aprobado', 'rechazado']
  if (!validStatuses.includes(body.status as CmBudgetStatus)) return NextResponse.json({ error: 'Estado inválido. Usar: borrador, enviado, aprobado, o rechazado.' }, { status: 400 })
  const budget = setBudgetStatus(id, body.status as CmBudgetStatus)
  if (!budget) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ budget })
}
