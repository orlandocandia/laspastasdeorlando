import { NextResponse } from 'next/server'
import { setClientStatus } from '@/lib/cocina-movil/clients'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.isActive !== 'boolean') return NextResponse.json({ error: 'isActive debe ser boolean.' }, { status: 400 })
  const client = setClientStatus(id, body.isActive)
  if (!client) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ client })
}
