import { NextResponse } from 'next/server'
import { markPurchaseOrderAsBought } from '@/lib/cocina-movil/purchase-orders'
import { requireAdmin } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }

  if (typeof body.purchaseId === 'string' && body.purchaseId) {
    const order = markPurchaseOrderAsBought(id, body.purchaseId)
    if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ order })
  }

  return NextResponse.json({ error: 'Se requiere purchaseId.' }, { status: 400 })
}
