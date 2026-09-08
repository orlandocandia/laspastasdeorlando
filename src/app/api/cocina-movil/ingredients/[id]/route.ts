import { NextResponse } from 'next/server'
import { getIngredientById, updateIngredient, deleteIngredient, type CmIngredientCategory, type CmUnit, type CmIngredientInput } from '@/lib/cocina-movil/ingredients'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ing = getIngredientById(id)
  if (!ing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ingredient: ing })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmIngredientInput> = {}
  if (typeof body.name === 'string') updates.name = body.name
  if (body.description !== undefined) updates.description = typeof body.description === 'string' ? body.description : null
  if (body.category !== undefined) {
    const validCats: CmIngredientCategory[] = ['harinas','carnes','lacteos','verduras','especias','aceites','otros']
    updates.category = validCats.includes(body.category as CmIngredientCategory) ? body.category as CmIngredientCategory : null
  }
  if (body.purchaseUnit !== undefined) {
    const validUnits: CmUnit[] = ['kg','g','l','ml','u','paquete','docena']
    updates.purchaseUnit = validUnits.includes(body.purchaseUnit as CmUnit) ? body.purchaseUnit as CmUnit : 'kg'
  }
  if (body.purchasePrice !== undefined) updates.purchasePrice = typeof body.purchasePrice === 'number' ? body.purchasePrice : 0
  if (body.gramsPerUnit !== undefined) updates.gramsPerUnit = typeof body.gramsPerUnit === 'number' ? body.gramsPerUnit : null
  if (body.image !== undefined) updates.image = typeof body.image === 'string' ? body.image : null
  if (body.supplierId !== undefined) updates.supplierId = typeof body.supplierId === 'string' ? body.supplierId : null
  if (body.isActive !== undefined) updates.isActive = !!body.isActive
  try {
    const ing = updateIngredient(id, updates)
    if (!ing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ingredient: ing })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = deleteIngredient(id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminado' })
}
