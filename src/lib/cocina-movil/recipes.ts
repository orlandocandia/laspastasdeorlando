/**
 * ============================================================
 * Cocina Móvil — Store de Recetas (demo)
 * ============================================================
 * Modelo master-detail: Recipe + RecipeIngredient[] + RecipeSupply[].
 * Calcula costos automáticamente (ingredientes + insumos).
 * ============================================================
 */
import crypto from 'crypto'
import { getIngredientById } from '@/lib/cocina-movil/ingredients'
import { getSupplyById } from '@/lib/cocina-movil/supplies'

export type CmRecipeCategory = 'carnes' | 'pastas' | 'postres' | 'aperitivos' | 'bebidas' | 'otros'
export type CmRecipeDifficulty = 'facil' | 'media' | 'dificil'

export interface CmRecipeIngredient {
  id: string
  recipeId: string
  ingredientId: string
  ingredientName: string // snapshot
  quantity: number
  unit: string
  cost: number // quantity × ingredient.purchasePrice (aprox)
}

export interface CmRecipeSupply {
  id: string
  recipeId: string
  supplyId: string
  supplyName: string // snapshot
  quantity: number
  unit: string
  cost: number
}

export interface CmRecipeRecord {
  id: string
  title: string
  description: string | null
  category: CmRecipeCategory
  preparationTime: string | null
  cookingTime: string | null
  difficulty: CmRecipeDifficulty | null
  servings: number
  steps: string | null
  image: string | null
  cookId: string | null
  ingredients: CmRecipeIngredient[]
  supplies: CmRecipeSupply[]
  ingredientsCost: number
  suppliesCost: number
  totalCost: number // ingredientsCost + suppliesCost
  costPerServing: number // totalCost / servings
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface CmRecipeInput {
  title: string
  description?: string | null
  category: CmRecipeCategory
  preparationTime?: string | null
  cookingTime?: string | null
  difficulty?: CmRecipeDifficulty | null
  servings: number
  steps?: string | null
  image?: string | null
  cookId?: string | null
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string }>
  supplies: Array<{ supplyId: string; quantity: number; unit: string }>
  isActive?: boolean
}

let recipesStore: Map<string, CmRecipeRecord> = new Map()

function seedDemoRecipes() {
  if (recipesStore.size > 0) return
  const now = Date.now()
  const r1: CmRecipeRecord = {
    id: 'recipe-1',
    title: 'Sorrentinos de Ricotta y Espinaca',
    description: 'Pasta rellena clásica con salsa de tomate',
    category: 'pastas',
    preparationTime: '45 min',
    cookingTime: '15 min',
    difficulty: 'media',
    servings: 4,
    steps: '1. Mezclar ricotta con espinaca picada\n2. Estirar la masa y cortar círculos\n3. Rellenar y cerrar\n4. Hervir 5 min\n5. Servir con salsa de tomate',
    image: null,
    cookId: 'cocinero-1',
    ingredients: [
      { id: 'ri-1', recipeId: 'recipe-1', ingredientId: 'ing-1', ingredientName: 'Harina 000', quantity: 0.5, unit: 'kg', cost: 225 },
      { id: 'ri-2', recipeId: 'recipe-1', ingredientId: 'ing-3', ingredientName: 'Queso Mozzarella', quantity: 0.2, unit: 'kg', cost: 560 },
      { id: 'ri-3', recipeId: 'recipe-1', ingredientId: 'ing-4', ingredientName: 'Huevos', quantity: 0.5, unit: 'docena', cost: 900 },
    ],
    supplies: [
      { id: 'rs-1', recipeId: 'recipe-1', supplyId: 'sup-3', supplyName: 'Film Polietileno', quantity: 0.1, unit: 'rollo', cost: 80 },
    ],
    ingredientsCost: 1685,
    suppliesCost: 80,
    totalCost: 1765,
    costPerServing: 441.25,
    isActive: true,
    createdAt: now - 86400000 * 5,
    updatedAt: now - 86400000 * 5,
  }
  const r2: CmRecipeRecord = {
    id: 'recipe-2',
    title: 'Ravioles de Carne',
    description: 'Ravioles rellenos de carne molida',
    category: 'pastas',
    preparationTime: '60 min',
    cookingTime: '10 min',
    difficulty: 'dificil',
    servings: 6,
    steps: '1. Preparar el relleno con carne molida\n2. Estirar la masa\n3. Rellenar y cortar\n4. Hervir 4 min\n5. Servir con tuco',
    image: null,
    cookId: 'cocinero-1',
    ingredients: [
      { id: 'ri-4', recipeId: 'recipe-2', ingredientId: 'ing-1', ingredientName: 'Harina 000', quantity: 0.8, unit: 'kg', cost: 360 },
      { id: 'ri-5', recipeId: 'recipe-2', ingredientId: 'ing-2', ingredientName: 'Carne Molida', quantity: 0.5, unit: 'kg', cost: 1600 },
      { id: 'ri-6', recipeId: 'recipe-2', ingredientId: 'ing-4', ingredientName: 'Huevos', quantity: 0.5, unit: 'docena', cost: 900 },
    ],
    supplies: [],
    ingredientsCost: 2860,
    suppliesCost: 0,
    totalCost: 2860,
    costPerServing: 476.67,
    isActive: true,
    createdAt: now - 86400000 * 2,
    updatedAt: now - 86400000 * 2,
  }
  recipesStore.set(r1.id, r1)
  recipesStore.set(r2.id, r2)
}
seedDemoRecipes()

/**
 * Lista recetas con filtros opcionales.
 */
export function listRecipes(options?: {
  search?: string
  category?: CmRecipeCategory | 'all'
  isActive?: boolean | 'all'
  sortBy?: 'title' | 'totalCost' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { recipes: CmRecipeRecord[]; total: number; page: number; pageSize: number } {
  const { search, category = 'all', isActive = 'all', sortBy = 'title', sortOrder = 'asc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(recipesStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((r) => r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
  }
  if (category !== 'all') items = items.filter((r) => r.category === category)
  if (isActive !== 'all') items = items.filter((r) => r.isActive === isActive)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'title') cmp = a.title.localeCompare(b.title)
    else if (sortBy === 'totalCost') cmp = a.totalCost - b.totalCost
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { recipes: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getRecipeById(id: string): CmRecipeRecord | null {
  return recipesStore.get(id) || null
}

/**
 * Crea una nueva receta con ingredientes e insumos.
 * Calcula costos automáticamente.
 */
export function createRecipe(input: CmRecipeInput): CmRecipeRecord {
  if (!input.title.trim()) throw new Error('El título es obligatorio')
  if (!input.servings || input.servings <= 0) throw new Error('Las porciones deben ser mayores a 0')

  const validCats: CmRecipeCategory[] = ['carnes', 'pastas', 'postres', 'aperitivos', 'bebidas', 'otros']
  if (!validCats.includes(input.category)) throw new Error('Categoría inválida')

  const now = Date.now()
  const id = `recipe-${crypto.randomBytes(6).toString('hex')}`

  // Build ingredients with snapshots and cost
  const ingredients: CmRecipeIngredient[] = (input.ingredients || []).map((item) => {
    const ing = getIngredientById(item.ingredientId)
    if (!ing) throw new Error(`Materia prima no encontrada: ${item.ingredientId}`)
    const cost = Number(item.quantity) * ing.purchasePrice
    return {
      id: `ri-${crypto.randomBytes(4).toString('hex')}`,
      recipeId: id,
      ingredientId: item.ingredientId,
      ingredientName: ing.name,
      quantity: Number(item.quantity),
      unit: item.unit || ing.purchaseUnit,
      cost,
    }
  })

  // Build supplies with snapshots and cost
  const supplies: CmRecipeSupply[] = (input.supplies || []).map((item) => {
    const sup = getSupplyById(item.supplyId)
    if (!sup) throw new Error(`Insumo no encontrado: ${item.supplyId}`)
    const cost = Number(item.quantity) * sup.purchasePrice
    return {
      id: `rs-${crypto.randomBytes(4).toString('hex')}`,
      recipeId: id,
      supplyId: item.supplyId,
      supplyName: sup.name,
      quantity: Number(item.quantity),
      unit: item.unit || sup.purchaseUnit,
      cost,
    }
  })

  const ingredientsCost = ingredients.reduce((sum, i) => sum + i.cost, 0)
  const suppliesCost = supplies.reduce((sum, s) => sum + s.cost, 0)
  const totalCost = ingredientsCost + suppliesCost
  const costPerServing = totalCost / Number(input.servings)

  const recipe: CmRecipeRecord = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    preparationTime: input.preparationTime?.trim() || null,
    cookingTime: input.cookingTime?.trim() || null,
    difficulty: input.difficulty || null,
    servings: Number(input.servings),
    steps: input.steps?.trim() || null,
    image: input.image || null,
    cookId: input.cookId || null,
    ingredients,
    supplies,
    ingredientsCost,
    suppliesCost,
    totalCost,
    costPerServing,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }

  recipesStore.set(id, recipe)
  console.log('[CocinaMóvil-Recipes] Receta creada:', id, recipe.title, 'Total:', totalCost)
  return recipe
}

/**
 * Actualiza una receta (incluyendo ingredientes e insumos).
 */
export function updateRecipe(id: string, updates: Partial<CmRecipeInput>): CmRecipeRecord | null {
  const r = recipesStore.get(id)
  if (!r) return null

  if (updates.title !== undefined) {
    if (!updates.title.trim()) throw new Error('El título es obligatorio')
    r.title = updates.title.trim()
  }
  if (updates.description !== undefined) r.description = updates.description?.trim() || null
  if (updates.category !== undefined) {
    const validCats: CmRecipeCategory[] = ['carnes', 'pastas', 'postres', 'aperitivos', 'bebidas', 'otros']
    if (validCats.includes(updates.category)) r.category = updates.category
  }
  if (updates.preparationTime !== undefined) r.preparationTime = updates.preparationTime?.trim() || null
  if (updates.cookingTime !== undefined) r.cookingTime = updates.cookingTime?.trim() || null
  if (updates.difficulty !== undefined) r.difficulty = updates.difficulty || null
  if (updates.servings !== undefined) {
    if (updates.servings <= 0) throw new Error('Las porciones deben ser mayores a 0')
    r.servings = Number(updates.servings)
  }
  if (updates.steps !== undefined) r.steps = updates.steps?.trim() || null
  if (updates.image !== undefined) r.image = updates.image || null
  if (updates.cookId !== undefined) r.cookId = updates.cookId || null
  if (updates.isActive !== undefined) r.isActive = updates.isActive

  if (updates.ingredients !== undefined) {
    r.ingredients = updates.ingredients.map((item) => {
      const ing = getIngredientById(item.ingredientId)
      if (!ing) throw new Error(`Materia prima no encontrada: ${item.ingredientId}`)
      const cost = Number(item.quantity) * ing.purchasePrice
      return {
        id: `ri-${crypto.randomBytes(4).toString('hex')}`,
        recipeId: id,
        ingredientId: item.ingredientId,
        ingredientName: ing.name,
        quantity: Number(item.quantity),
        unit: item.unit || ing.purchaseUnit,
        cost,
      }
    })
  }

  if (updates.supplies !== undefined) {
    r.supplies = updates.supplies.map((item) => {
      const sup = getSupplyById(item.supplyId)
      if (!sup) throw new Error(`Insumo no encontrado: ${item.supplyId}`)
      const cost = Number(item.quantity) * sup.purchasePrice
      return {
        id: `rs-${crypto.randomBytes(4).toString('hex')}`,
        recipeId: id,
        supplyId: item.supplyId,
        supplyName: sup.name,
        quantity: Number(item.quantity),
        unit: item.unit || sup.purchaseUnit,
        cost,
      }
    })
  }

  // Recalculate costs
  r.ingredientsCost = r.ingredients.reduce((sum, i) => sum + i.cost, 0)
  r.suppliesCost = r.supplies.reduce((sum, s) => sum + s.cost, 0)
  r.totalCost = r.ingredientsCost + r.suppliesCost
  r.costPerServing = r.servings > 0 ? r.totalCost / r.servings : 0

  r.updatedAt = Date.now()
  recipesStore.set(id, r)
  console.log('[CocinaMóvil-Recipes] Receta actualizada:', id)
  return r
}

export function setRecipeStatus(id: string, isActive: boolean): CmRecipeRecord | null {
  const r = recipesStore.get(id)
  if (!r) return null
  r.isActive = isActive
  r.updatedAt = Date.now()
  recipesStore.set(id, r)
  return r
}

export function deleteRecipe(id: string): boolean {
  const r = recipesStore.get(id)
  if (!r) return false
  recipesStore.delete(id)
  console.log('[CocinaMóvil-Recipes] Receta eliminada:', id)
  return true
}
