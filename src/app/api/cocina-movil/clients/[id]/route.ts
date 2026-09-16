import { NextResponse } from 'next/server'
import { getClientById, updateClient, deleteClient, type CmClientInput } from '@/lib/cocina-movil/clients'
import { requireAdmin } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const client = getClientById(id)
  if (!client) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ client })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmClientInput> = {}
  if (typeof body.firstName === 'string') updates.firstName = body.firstName
  if (typeof body.lastName === 'string') updates.lastName = body.lastName
  if (body.dni !== undefined) updates.dni = typeof body.dni === 'string' ? body.dni : null
  if (body.phone !== undefined) updates.phone = typeof body.phone === 'string' ? body.phone : null
  if (body.email !== undefined) updates.email = typeof body.email === 'string' ? body.email : null
  if (body.address !== undefined) updates.address = typeof body.address === 'string' ? body.address : null
  if (body.city !== undefined) updates.city = typeof body.city === 'string' ? body.city : null
  if (body.birthDate !== undefined) updates.birthDate = typeof body.birthDate === 'number' ? body.birthDate : null
  if (body.notes !== undefined) updates.notes = typeof body.notes === 'string' ? body.notes : null
  if (body.country !== undefined) updates.country = typeof body.country === 'string' ? body.country : null
  if (body.province !== undefined) updates.province = typeof body.province === 'string' ? body.province : null
  if (body.department !== undefined) updates.department = typeof body.department === 'string' ? body.department : null
  if (body.municipality !== undefined) updates.municipality = typeof body.municipality === 'string' ? body.municipality : null
  if (body.location !== undefined) updates.location = typeof body.location === 'string' ? body.location : null
  if (body.avatar !== undefined) updates.avatar = typeof body.avatar === 'string' ? body.avatar : null
  if (body.isActive !== undefined) updates.isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined
  try {
    const client = updateClient(id, updates)
    if (!client) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ client })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const ok = deleteClient(id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminado' })
}
