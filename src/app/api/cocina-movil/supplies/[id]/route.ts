import { NextResponse } from 'next/server'
import { getSupplyById, updateSupply, deleteSupply, type CmSupplyCategory, type CmSupplyUnit, type CmSupplyInput } from '@/lib/cocina-movil/supplies'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const sup = getSupplyById(id)
  if (!sup) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ supply: sup })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmSupplyInput> = {}
  if (typeof body.name === 'string') updates.name = body.name
  if (body.description !== undefined) updates.description = typeof body.description === 'string' ? body.description : null
  if (body.category !== undefined) {
    const validCats: CmSupplyCategory[] = ['envases','limpieza','descartables','otros']
    updates.category = validCats.includes(body.category as CmSupplyCategory) ? body.category as CmSupplyCategory : null
  }
  if (body.purchaseUnit !== undefined) {
    const validUnits: CmSupplyUnit[] = ['u','m','kg','paquete','caja','rollo']
    updates.purchaseUnit = validUnits.includes(body.purchaseUnit as CmSupplyUnit) ? body.purchaseUnit as CmSupplyUnit : 'u'
  }
  if (body.purchasePrice !== undefined) updates.purchasePrice = typeof body.purchasePrice === 'number' ? body.purchasePrice : 0
  if (body.image !== undefined) updates.image = typeof body.image === 'string' ? body.image : null
  if (body.supplierId !== undefined) updates.supplierId = typeof body.supplierId === 'string' ? body.supplierId : null
  if (body.isActive !== undefined) updates.isActive = !!body.isActive
  try {
    const sup = updateSupply(id, updates)
    if (!sup) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ supply: sup })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const ok = deleteSupply(id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminado' })
}
