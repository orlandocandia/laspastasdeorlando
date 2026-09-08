import { NextResponse } from 'next/server'
import { listIngredients, createIngredient, type CmIngredientCategory, type CmUnit, type CmIngredientInput } from '@/lib/cocina-movil/ingredients'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const catParam = url.searchParams.get('category') || 'all'
  const statusParam = url.searchParams.get('isActive') || 'all'
  const sortBy = (url.searchParams.get('sortBy') as 'name' | 'purchasePrice' | 'createdAt') || 'name'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const validCats: CmIngredientCategory[] = ['harinas','carnes','lacteos','verduras','especias','aceites','otros']
  const category = validCats.includes(catParam as CmIngredientCategory) ? catParam as CmIngredientCategory : 'all'
  const isActive = statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'
  const result = listIngredients({ search, category, isActive, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.name !== 'string' || !body.name.trim()) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 })
  const validUnits: CmUnit[] = ['kg','g','l','ml','u','paquete','docena']
  const validCats: CmIngredientCategory[] = ['harinas','carnes','lacteos','verduras','especias','aceites','otros']
  const input: CmIngredientInput = {
    name: body.name,
    description: typeof body.description === 'string' ? body.description : null,
    category: validCats.includes(body.category as CmIngredientCategory) ? body.category as CmIngredientCategory : null,
    purchaseUnit: validUnits.includes(body.purchaseUnit as CmUnit) ? body.purchaseUnit as CmUnit : 'kg',
    purchasePrice: typeof body.purchasePrice === 'number' ? body.purchasePrice : 0,
    gramsPerUnit: typeof body.gramsPerUnit === 'number' ? body.gramsPerUnit : null,
    image: typeof body.image === 'string' ? body.image : null,
    supplierId: typeof body.supplierId === 'string' ? body.supplierId : null,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
  }
  try {
    const ing = createIngredient(input)
    return NextResponse.json({ ingredient: ing }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear' }, { status: 400 })
  }
}
