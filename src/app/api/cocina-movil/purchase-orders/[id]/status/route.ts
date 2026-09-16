import { NextResponse } from 'next/server'
import { setPurchaseOrderStatus, type CmPurchaseOrderStatus } from '@/lib/cocina-movil/purchase-orders'
import { requireAdmin } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const validStatuses: CmPurchaseOrderStatus[] = ['pendiente', 'enviado', 'recibido', 'comprado', 'cancelado']
  if (!validStatuses.includes(body.status as CmPurchaseOrderStatus)) {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
  }
  const order = setPurchaseOrderStatus(id, body.status as CmPurchaseOrderStatus)
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ order })
}
