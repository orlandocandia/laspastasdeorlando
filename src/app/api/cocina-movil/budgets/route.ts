import { NextResponse } from 'next/server'
import { listBudgets, createBudget, type CmBudgetStatus, type CmBudgetInput } from '@/lib/cocina-movil/budgets'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const statusParam = url.searchParams.get('status') || 'all'
  const dateFrom = url.searchParams.get('dateFrom') ? parseInt(url.searchParams.get('dateFrom')!, 10) : null
  const dateTo = url.searchParams.get('dateTo') ? parseInt(url.searchParams.get('dateTo')!, 10) : null
  const sortBy = (url.searchParams.get('sortBy') as 'createdAt' | 'totalPrice' | 'profit') || 'createdAt'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const validStatuses: CmBudgetStatus[] = ['borrador', 'enviado', 'aprobado', 'rechazado']
  const status = validStatuses.includes(statusParam as CmBudgetStatus) ? statusParam as CmBudgetStatus : 'all'
  const result = listBudgets({ search, status, dateFrom, dateTo, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.recipeId !== 'string' || !body.recipeId) return NextResponse.json({ error: 'La receta es obligatoria.' }, { status: 400 })
  if (typeof body.servings !== 'number' || body.servings <= 0) return NextResponse.json({ error: 'Las porciones deben ser mayores a 0.' }, { status: 400 })
  if (typeof body.pricePerServing !== 'number' || body.pricePerServing <= 0) return NextResponse.json({ error: 'El precio por porción debe ser mayor a 0.' }, { status: 400 })
  const input: CmBudgetInput = {
    recipeId: body.recipeId,
    clientName: typeof body.clientName === 'string' ? body.clientName : null,
    servings: body.servings,
    pricePerServing: body.pricePerServing,
    observations: typeof body.observations === 'string' ? body.observations : null,
  }
  try {
    const budget = createBudget(input)
    return NextResponse.json({ budget }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear presupuesto' }, { status: 400 })
  }
}
