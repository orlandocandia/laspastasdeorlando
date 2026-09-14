import { NextResponse } from 'next/server'
import { listPurchaseOrders, createPurchaseOrder, type CmPurchaseOrderStatus, type CmPurchaseOrderInput } from '@/lib/cocina-movil/purchase-orders'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const supplierId = url.searchParams.get('supplierId') || null
  const statusParam = url.searchParams.get('status') || 'all'
  const dateFrom = url.searchParams.get('dateFrom') ? parseInt(url.searchParams.get('dateFrom')!, 10) : null
  const dateTo = url.searchParams.get('dateTo') ? parseInt(url.searchParams.get('dateTo')!, 10) : null
  const sortBy = (url.searchParams.get('sortBy') as 'orderDate' | 'total' | 'createdAt') || 'orderDate'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const validStatuses: CmPurchaseOrderStatus[] = ['pendiente', 'enviado', 'recibido', 'comprado', 'cancelado']
  const status = validStatuses.includes(statusParam as CmPurchaseOrderStatus) ? statusParam as CmPurchaseOrderStatus : 'all'
  const result = listPurchaseOrders({ search, supplierId, status, dateFrom, dateTo, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.supplierId !== 'string' || !body.supplierId) return NextResponse.json({ error: 'El proveedor es obligatorio.' }, { status: 400 })
  if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: 'Debe agregar al menos un item.' }, { status: 400 })

  for (const it of body.items) {
    if (typeof it !== 'object' || it === null || typeof it.itemId !== 'string' || !it.itemId) {
      return NextResponse.json({ error: 'Todos los items deben tener un producto.' }, { status: 400 })
    }
    if (typeof it.quantity !== 'number' || it.quantity <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor a 0.' }, { status: 400 })
    }
  }

  const input: CmPurchaseOrderInput = {
    supplierId: body.supplierId,
    orderDate: typeof body.orderDate === 'number' ? body.orderDate : undefined,
    expectedDeliveryDate: typeof body.expectedDeliveryDate === 'number' ? body.expectedDeliveryDate : null,
    observations: typeof body.observations === 'string' ? body.observations : null,
    items: (body.items as Array<Record<string, unknown>>).map((it) => ({
      itemType: it.itemType === 'supply' ? 'supply' as const : 'ingredient' as const,
      itemId: it.itemId as string,
      quantity: it.quantity as number,
      unit: typeof it.unit === 'string' ? it.unit : 'u',
      pricePerUnit: typeof it.pricePerUnit === 'number' ? it.pricePerUnit : 0,
    })),
  }
  try {
    const order = createPurchaseOrder(input)
    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear pedido' }, { status: 400 })
  }
}
