import { NextResponse } from 'next/server'
import { setProductionStatus, type CmProductionStatus } from '@/lib/cocina-movil/productions'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: { status?: unknown; rejectionReason?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const validStatuses: CmProductionStatus[] = ['pending', 'confirmed', 'rejected']
  if (!validStatuses.includes(body.status as CmProductionStatus)) return NextResponse.json({ error: 'Estado inválido. Usar: pending, confirmed, o rejected.' }, { status: 400 })
  const prod = setProductionStatus(id, body.status as CmProductionStatus, typeof body.rejectionReason === 'string' ? body.rejectionReason : undefined)
  if (!prod) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ production: prod })
}
