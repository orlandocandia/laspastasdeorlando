import { NextResponse } from 'next/server'
import { listClientOrders, createClientOrder, type CmClientOrderStatus, type CmClientOrderInput } from '@/lib/cocina-movil/client-orders'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const statusParam = url.searchParams.get('status') || 'all'
  const dateFrom = url.searchParams.get('dateFrom') ? parseInt(url.searchParams.get('dateFrom')!, 10) : null
  const dateTo = url.searchParams.get('dateTo') ? parseInt(url.searchParams.get('dateTo')!, 10) : null
  const sortBy = (url.searchParams.get('sortBy') as 'orderDate' | 'total' | 'createdAt') || 'orderDate'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const validStatuses: CmClientOrderStatus[] = ['pendiente', 'en_preparacion', 'entregado', 'vendido', 'cancelado']
  const status = validStatuses.includes(statusParam as CmClientOrderStatus) ? statusParam as CmClientOrderStatus : 'all'
  const result = listClientOrders({ search, status, dateFrom, dateTo, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: 'Debe agregar al menos un item.' }, { status: 400 })
  for (const it of body.items) {
    if (typeof it !== 'object' || it === null || typeof it.recipeId !== 'string' || !it.recipeId) {
      return NextResponse.json({ error: 'Todos los items deben tener una receta.' }, { status: 400 })
    }
    if (typeof it.quantity !== 'number' || it.quantity <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor a 0.' }, { status: 400 })
    }
  }
  const input: CmClientOrderInput = {
    clientName: typeof body.clientName === 'string' ? body.clientName : null,
    clientPhone: typeof body.clientPhone === 'string' ? body.clientPhone : null,
    clientEmail: typeof body.clientEmail === 'string' ? body.clientEmail : null,
    orderDate: typeof body.orderDate === 'number' ? body.orderDate : undefined,
    expectedDeliveryDate: typeof body.expectedDeliveryDate === 'number' ? body.expectedDeliveryDate : null,
    observations: typeof body.observations === 'string' ? body.observations : null,
    items: (body.items as Array<Record<string, unknown>>).map((it) => ({
      recipeId: it.recipeId as string,
      quantity: it.quantity as number,
      unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : 0,
    })),
    budgetId: typeof body.budgetId === 'string' ? body.budgetId : null,
    budgetNumber: typeof body.budgetNumber === 'string' ? body.budgetNumber : null,
  }
  try {
    const order = createClientOrder(input)
    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear pedido' }, { status: 400 })
  }
}
