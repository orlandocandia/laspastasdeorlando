import { NextResponse } from 'next/server'
import { listSales, createSale, type CmSaleInput } from '@/lib/cocina-movil/sales'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const recipeId = url.searchParams.get('recipeId') || null
  const placeId = url.searchParams.get('placeId') || null
  const dateFrom = url.searchParams.get('dateFrom') ? parseInt(url.searchParams.get('dateFrom')!, 10) : null
  const dateTo = url.searchParams.get('dateTo') ? parseInt(url.searchParams.get('dateTo')!, 10) : null
  const sortBy = (url.searchParams.get('sortBy') as 'saleDate' | 'totalPrice' | 'profit') || 'saleDate'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const result = listSales({ search, recipeId, placeId, dateFrom, dateTo, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.recipeId !== 'string' || !body.recipeId) return NextResponse.json({ error: 'La receta es obligatoria.' }, { status: 400 })
  if (typeof body.placeId !== 'string' || !body.placeId) return NextResponse.json({ error: 'El lugar es obligatorio.' }, { status: 400 })
  if (typeof body.quantity !== 'number' || body.quantity <= 0) return NextResponse.json({ error: 'La cantidad debe ser mayor a 0.' }, { status: 400 })
  if (typeof body.unitPrice !== 'number' || body.unitPrice <= 0) return NextResponse.json({ error: 'El precio debe ser mayor a 0.' }, { status: 400 })
  const input: CmSaleInput = {
    recipeId: body.recipeId,
    placeId: body.placeId,
    clientName: typeof body.clientName === 'string' ? body.clientName : null,
    quantity: body.quantity,
    unitPrice: body.unitPrice,
    saleDate: typeof body.saleDate === 'number' ? body.saleDate : undefined,
    observations: typeof body.observations === 'string' ? body.observations : null,
  }
  try {
    const sale = createSale(input)
    return NextResponse.json({ sale }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear venta' }, { status: 400 })
  }
}
