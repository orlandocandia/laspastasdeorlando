import { NextResponse } from 'next/server'
import { listPurchases, createPurchase, type CmPurchaseInput } from '@/lib/cocina-movil/purchases'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const supplierId = url.searchParams.get('supplierId') || null
  const placeId = url.searchParams.get('placeId') || null
  const dateFrom = url.searchParams.get('dateFrom') ? parseInt(url.searchParams.get('dateFrom')!, 10) : null
  const dateTo = url.searchParams.get('dateTo') ? parseInt(url.searchParams.get('dateTo')!, 10) : null
  const sortBy = (url.searchParams.get('sortBy') as 'purchaseDate' | 'total' | 'createdAt') || 'purchaseDate'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))

  const result = listPurchases({ search, supplierId, placeId, dateFrom, dateTo, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }

  if (typeof body.supplierId !== 'string' || !body.supplierId) {
    return NextResponse.json({ error: 'El proveedor es obligatorio.' }, { status: 400 })
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'La compra debe tener al menos un item.' }, { status: 400 })
  }

  const input: CmPurchaseInput = {
    supplierId: body.supplierId,
    placeId: typeof body.placeId === 'string' ? body.placeId : null,
    purchaseDate: typeof body.purchaseDate === 'number' ? body.purchaseDate : Date.now(),
    invoiceNumber: typeof body.invoiceNumber === 'string' ? body.invoiceNumber : null,
    observations: typeof body.observations === 'string' ? body.observations : null,
    items: body.items.map((item: Record<string, unknown>) => ({
      itemType: item.itemType === 'supply' ? 'supply' as const : 'ingredient' as const,
      itemId: typeof item.itemId === 'string' ? item.itemId : '',
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      unit: typeof item.unit === 'string' ? item.unit : 'kg',
      pricePerUnit: typeof item.pricePerUnit === 'number' ? item.pricePerUnit : 0,
    })),
  }

  try {
    const purchase = createPurchase(input)
    return NextResponse.json({ purchase }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear compra' }, { status: 400 })
  }
}
