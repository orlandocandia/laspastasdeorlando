import { NextResponse } from 'next/server'
import { getRecipeById, updateRecipe, deleteRecipe, type CmRecipeCategory, type CmRecipeDifficulty, type CmRecipeInput } from '@/lib/cocina-movil/recipes'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const recipe = getRecipeById(id)
  if (!recipe) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ recipe })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const updates: Partial<CmRecipeInput> = {}
  if (typeof body.title === 'string') updates.title = body.title
  if (body.description !== undefined) updates.description = typeof body.description === 'string' ? body.description : null
  if (body.category !== undefined) {
    const validCats: CmRecipeCategory[] = ['carnes','pastas','postres','aperitivos','bebidas','otros']
    if (validCats.includes(body.category as CmRecipeCategory)) updates.category = body.category as CmRecipeCategory
  }
  if (body.preparationTime !== undefined) updates.preparationTime = typeof body.preparationTime === 'string' ? body.preparationTime : null
  if (body.cookingTime !== undefined) updates.cookingTime = typeof body.cookingTime === 'string' ? body.cookingTime : null
  if (body.difficulty !== undefined) {
    const validDifficulties: CmRecipeDifficulty[] = ['facil','media','dificil']
    updates.difficulty = validDifficulties.includes(body.difficulty as CmRecipeDifficulty) ? body.difficulty as CmRecipeDifficulty : null
  }
  if (body.servings !== undefined) updates.servings = typeof body.servings === 'number' ? body.servings : 1
  if (body.steps !== undefined) updates.steps = typeof body.steps === 'string' ? body.steps : null
  if (body.image !== undefined) updates.image = typeof body.image === 'string' ? body.image : null
  if (body.cookId !== undefined) updates.cookId = typeof body.cookId === 'string' ? body.cookId : null
  if (body.isActive !== undefined) updates.isActive = !!body.isActive
  if (Array.isArray(body.ingredients)) {
    updates.ingredients = body.ingredients.map((item: Record<string, unknown>) => ({
      ingredientId: typeof item.ingredientId === 'string' ? item.ingredientId : '',
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      unit: typeof item.unit === 'string' ? item.unit : 'kg',
    }))
  }
  if (Array.isArray(body.supplies)) {
    updates.supplies = body.supplies.map((item: Record<string, unknown>) => ({
      supplyId: typeof item.supplyId === 'string' ? item.supplyId : '',
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      unit: typeof item.unit === 'string' ? item.unit : 'u',
    }))
  }
  try {
    const recipe = updateRecipe(id, updates)
    if (!recipe) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ recipe })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(_request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const ok = deleteRecipe(id)
  if (!ok) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true, message: 'Eliminada' })
}
