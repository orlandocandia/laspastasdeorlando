import { NextResponse } from 'next/server'
import { listRecipes, createRecipe, type CmRecipeCategory, type CmRecipeDifficulty, type CmRecipeInput } from '@/lib/cocina-movil/recipes'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const catParam = url.searchParams.get('category') || 'all'
  const statusParam = url.searchParams.get('isActive') || 'all'
  const sortBy = (url.searchParams.get('sortBy') as 'title' | 'totalCost' | 'createdAt') || 'title'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const validCats: CmRecipeCategory[] = ['carnes','pastas','postres','aperitivos','bebidas','otros']
  const category = validCats.includes(catParam as CmRecipeCategory) ? catParam as CmRecipeCategory : 'all'
  const isActive = statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'
  const result = listRecipes({ search, category, isActive, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.title !== 'string' || !body.title.trim()) return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 })
  const validCats: CmRecipeCategory[] = ['carnes','pastas','postres','aperitivos','bebidas','otros']
  const validDifficulties: CmRecipeDifficulty[] = ['facil','media','dificil']
  const input: CmRecipeInput = {
    title: body.title,
    description: typeof body.description === 'string' ? body.description : null,
    category: validCats.includes(body.category as CmRecipeCategory) ? body.category as CmRecipeCategory : 'otros',
    preparationTime: typeof body.preparationTime === 'string' ? body.preparationTime : null,
    cookingTime: typeof body.cookingTime === 'string' ? body.cookingTime : null,
    difficulty: validDifficulties.includes(body.difficulty as CmRecipeDifficulty) ? body.difficulty as CmRecipeDifficulty : null,
    servings: typeof body.servings === 'number' ? body.servings : 1,
    steps: typeof body.steps === 'string' ? body.steps : null,
    image: typeof body.image === 'string' ? body.image : null,
    cookId: typeof body.cookId === 'string' ? body.cookId : null,
    ingredients: Array.isArray(body.ingredients) ? body.ingredients.map((item: Record<string, unknown>) => ({
      ingredientId: typeof item.ingredientId === 'string' ? item.ingredientId : '',
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      unit: typeof item.unit === 'string' ? item.unit : 'kg',
    })) : [],
    supplies: Array.isArray(body.supplies) ? body.supplies.map((item: Record<string, unknown>) => ({
      supplyId: typeof item.supplyId === 'string' ? item.supplyId : '',
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      unit: typeof item.unit === 'string' ? item.unit : 'u',
    })) : [],
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
  }
  try {
    const recipe = createRecipe(input)
    return NextResponse.json({ recipe }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear receta' }, { status: 400 })
  }
}
