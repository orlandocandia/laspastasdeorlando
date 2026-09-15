import { NextResponse } from 'next/server'
import { listSales, createSale, type CmSaleInput } from '@/lib/cocina-movil/sales'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
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
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.placeId !== 'string' || !body.placeId) return NextResponse.json({ error: 'El lugar es obligatorio.' }, { status: 400 })
  if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: 'Debe agregar al menos un item.' }, { status: 400 })

  // Validate each item
  for (const it of body.items) {
    if (typeof it !== 'object' || it === null || typeof it.recipeId !== 'string' || !it.recipeId) {
      return NextResponse.json({ error: 'Todos los items deben tener una receta.' }, { status: 400 })
    }
    if (typeof it.quantity !== 'number' || it.quantity <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor a 0.' }, { status: 400 })
    }
    if (typeof it.unitPrice !== 'number' || it.unitPrice < 0) {
      return NextResponse.json({ error: 'El precio no puede ser negativo.' }, { status: 400 })
    }
  }

  const input: CmSaleInput = {
    placeId: body.placeId,
    clientName: typeof body.clientName === 'string' ? body.clientName : null,
    invoiceNumber: typeof body.invoiceNumber === 'string' ? body.invoiceNumber : null,
    paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod : 'Efectivo',
    saleDate: typeof body.saleDate === 'number' ? body.saleDate : undefined,
    observations: typeof body.observations === 'string' ? body.observations : null,
    items: (body.items as Array<{ recipeId: string; quantity: number; unitPrice: number }>).map((it) => ({
      recipeId: it.recipeId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    discountType: body.discountType === 'percentage' || body.discountType === 'fixed' ? body.discountType : null,
    discountValue: typeof body.discountValue === 'number' ? body.discountValue : null,
    taxRate: typeof body.taxRate === 'number' ? body.taxRate : null,
    budgetId: typeof body.budgetId === 'string' ? body.budgetId : null,
  }
  try {
    const sale = createSale(input)
    return NextResponse.json({ sale }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear venta' }, { status: 400 })
  }
}
