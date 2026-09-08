import { NextResponse } from 'next/server'
import { getSupplierById, updateSupplier, deleteSupplier, type CmSupplierInput } from '@/lib/cocina-movil/suppliers'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const sup = getSupplierById(id)
  if (!sup) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ supplier: sup })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmSupplierInput> = {}
  for (const key of ['name', 'contactName', 'phone', 'email', 'address', 'country', 'province', 'department', 'municipality', 'location', 'image']) {
    if (body[key] !== undefined) updates[key as keyof CmSupplierInput] = typeof body[key] === 'string' ? body[key] : null
  }
  if (body.isActive !== undefined) updates.isActive = !!body.isActive
  try {
    const sup = updateSupplier(id, updates)
    if (!sup) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ supplier: sup })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const ok = deleteSupplier(id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminado' })
}
