import { NextResponse } from 'next/server'
import { listProductions, createProduction, type CmProductionStatus, type CmProductionInput } from '@/lib/cocina-movil/productions'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const placeId = url.searchParams.get('placeId') || null
  const statusParam = url.searchParams.get('status') || 'all'
  const dateFrom = url.searchParams.get('dateFrom') ? parseInt(url.searchParams.get('dateFrom')!, 10) : null
  const dateTo = url.searchParams.get('dateTo') ? parseInt(url.searchParams.get('dateTo')!, 10) : null
  const sortBy = (url.searchParams.get('sortBy') as 'createdAt' | 'cost' | 'quantity') || 'createdAt'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const validStatuses: CmProductionStatus[] = ['pending', 'confirmed', 'rejected']
  const status = validStatuses.includes(statusParam as CmProductionStatus) ? statusParam as CmProductionStatus : 'all'
  const result = listProductions({ search, placeId, status, dateFrom, dateTo, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.recipeId !== 'string' || !body.recipeId) return NextResponse.json({ error: 'La receta es obligatoria.' }, { status: 400 })
  if (typeof body.placeId !== 'string' || !body.placeId) return NextResponse.json({ error: 'El lugar es obligatorio.' }, { status: 400 })
  if (typeof body.quantity !== 'number' || body.quantity <= 0) return NextResponse.json({ error: 'La cantidad debe ser mayor a 0.' }, { status: 400 })
  const input: CmProductionInput = {
    recipeId: body.recipeId,
    placeId: body.placeId,
    cookId: typeof body.cookId === 'string' ? body.cookId : null,
    cookName: typeof body.cookName === 'string' ? body.cookName : null,
    quantity: body.quantity,
    observations: typeof body.observations === 'string' ? body.observations : null,
  }
  try {
    const prod = createProduction(input)
    return NextResponse.json({ production: prod }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear producción' }, { status: 400 })
  }
}
