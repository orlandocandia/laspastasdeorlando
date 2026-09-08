/**
 * ============================================================
 * Cocina Móvil — Store de Presupuestos (demo)
 * ============================================================
 * Cotiza recetas a clientes con cálculo de márgenes de ganancia.
 * Flujo de estados: borrador → enviado → aprobado | rechazado
 * ============================================================
 */
import crypto from 'crypto'
import { getRecipeById } from '@/lib/cocina-movil/recipes'

export type CmBudgetStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado'

export interface CmBudgetRecord {
  id: string
  recipeId: string
  recipeTitle: string // snapshot
  recipeCostPerServing: number // snapshot del costo al momento de crear
  clientName: string | null
  servings: number
  pricePerServing: number // precio de venta definido por el Admin
  totalCost: number // recipeCostPerServing × servings (auto)
  totalPrice: number // pricePerServing × servings (auto)
  profit: number // totalPrice - totalCost (auto)
  profitPercentage: number // (profit / totalPrice) × 100 (auto)
  observations: string | null
  status: CmBudgetStatus
  createdAt: number
  updatedAt: number
}

export interface CmBudgetInput {
  recipeId: string
  clientName?: string | null
  servings: number
  pricePerServing: number
  observations?: string | null
}

let budgetsStore: Map<string, CmBudgetRecord> = new Map()

function seedDemoBudgets() {
  if (budgetsStore.size > 0) return
  const now = Date.now()
  const recipe1 = getRecipeById('recipe-1') // Sorrentinos
  const recipe2 = getRecipeById('recipe-2') // Ravioles

  if (recipe1) {
    const b1: CmBudgetRecord = {
      id: 'budget-1',
      recipeId: 'recipe-1',
      recipeTitle: recipe1.title,
      recipeCostPerServing: recipe1.costPerServing,
      clientName: 'Restaurant La Esquina',
      servings: 50,
      pricePerServing: 1200,
      totalCost: recipe1.costPerServing * 50,
      totalPrice: 1200 * 50,
      profit: 1200 * 50 - recipe1.costPerServing * 50,
      profitPercentage: ((1200 - recipe1.costPerServing) / 1200) * 100,
      observations: 'Presupuesto para evento del sábado',
      status: 'enviado',
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 2,
    }
    budgetsStore.set(b1.id, b1)
  }

  if (recipe2) {
    const b2: CmBudgetRecord = {
      id: 'budget-2',
      recipeId: 'recipe-2',
      recipeTitle: recipe2.title,
      recipeCostPerServing: recipe2.costPerServing,
      clientName: 'Familia González',
      servings: 30,
      pricePerServing: 1500,
      totalCost: recipe2.costPerServing * 30,
      totalPrice: 1500 * 30,
      profit: 1500 * 30 - recipe2.costPerServing * 30,
      profitPercentage: ((1500 - recipe2.costPerServing) / 1500) * 100,
      observations: 'Catering para cumpleaños',
      status: 'borrador',
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
    }
    budgetsStore.set(b2.id, b2)
  }
}
seedDemoBudgets()

export function listBudgets(options?: {
  search?: string
  status?: CmBudgetStatus | 'all'
  dateFrom?: number | null
  dateTo?: number | null
  sortBy?: 'createdAt' | 'totalPrice' | 'profit'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { budgets: CmBudgetRecord[]; total: number; page: number; pageSize: number } {
  const { search, status = 'all', dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(budgetsStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((b) => b.recipeTitle.toLowerCase().includes(q) || (b.clientName || '').toLowerCase().includes(q))
  }
  if (status !== 'all') items = items.filter((b) => b.status === status)
  if (dateFrom) items = items.filter((b) => b.createdAt >= dateFrom)
  if (dateTo) items = items.filter((b) => b.createdAt <= dateTo)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'totalPrice') cmp = a.totalPrice - b.totalPrice
    else if (sortBy === 'profit') cmp = a.profit - b.profit
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { budgets: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getBudgetById(id: string): CmBudgetRecord | null {
  return budgetsStore.get(id) || null
}

export function createBudget(input: CmBudgetInput): CmBudgetRecord {
  if (!input.recipeId) throw new Error('La receta es obligatoria')
  if (!input.servings || input.servings <= 0) throw new Error('Las porciones deben ser mayores a 0')
  if (!input.pricePerServing || input.pricePerServing <= 0) throw new Error('El precio por porción debe ser mayor a 0')

  const recipe = getRecipeById(input.recipeId)
  if (!recipe) throw new Error('La receta no existe')

  const now = Date.now()
  const id = `budget-${crypto.randomBytes(6).toString('hex')}`
  const totalCost = recipe.costPerServing * Number(input.servings)
  const totalPrice = Number(input.pricePerServing) * Number(input.servings)
  const profit = totalPrice - totalCost
  const profitPercentage = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

  const budget: CmBudgetRecord = {
    id,
    recipeId: input.recipeId,
    recipeTitle: recipe.title,
    recipeCostPerServing: recipe.costPerServing,
    clientName: input.clientName?.trim() || null,
    servings: Number(input.servings),
    pricePerServing: Number(input.pricePerServing),
    totalCost,
    totalPrice,
    profit,
    profitPercentage,
    observations: input.observations?.trim() || null,
    status: 'borrador',
    createdAt: now,
    updatedAt: now,
  }
  budgetsStore.set(id, budget)
  console.log('[CocinaMóvil-Budgets] Presupuesto creado:', id, 'Profit:', profit)
  return budget
}

export function updateBudget(id: string, updates: Partial<CmBudgetInput>): CmBudgetRecord | null {
  const b = budgetsStore.get(id)
  if (!b) return null
  if (b.status !== 'borrador') throw new Error('Solo se pueden editar presupuestos en borrador')

  if (updates.recipeId) {
    const recipe = getRecipeById(updates.recipeId)
    if (!recipe) throw new Error('La receta no existe')
    b.recipeId = updates.recipeId
    b.recipeTitle = recipe.title
    b.recipeCostPerServing = recipe.costPerServing
  }
  if (updates.clientName !== undefined) b.clientName = updates.clientName?.trim() || null
  if (updates.servings !== undefined) {
    if (updates.servings <= 0) throw new Error('Las porciones deben ser mayores a 0')
    b.servings = Number(updates.servings)
  }
  if (updates.pricePerServing !== undefined) {
    if (updates.pricePerServing <= 0) throw new Error('El precio debe ser mayor a 0')
    b.pricePerServing = Number(updates.pricePerServing)
  }
  if (updates.observations !== undefined) b.observations = updates.observations?.trim() || null

  // Recalcular
  b.totalCost = b.recipeCostPerServing * b.servings
  b.totalPrice = b.pricePerServing * b.servings
  b.profit = b.totalPrice - b.totalCost
  b.profitPercentage = b.totalPrice > 0 ? (b.profit / b.totalPrice) * 100 : 0

  b.updatedAt = Date.now()
  budgetsStore.set(id, b)
  console.log('[CocinaMóvil-Budgets] Presupuesto actualizado:', id)
  return b
}

export function setBudgetStatus(id: string, status: CmBudgetStatus): CmBudgetRecord | null {
  const b = budgetsStore.get(id)
  if (!b) return null
  b.status = status
  b.updatedAt = Date.now()
  budgetsStore.set(id, b)
  console.log('[CocinaMóvil-Budgets] Estado cambiado:', id, '→', status)
  return b
}

export function deleteBudget(id: string): boolean {
  const b = budgetsStore.get(id)
  if (!b) return false
  if (b.status === 'enviado' || b.status === 'aprobado') throw new Error('No se puede eliminar un presupuesto enviado o aprobado')
  budgetsStore.delete(id)
  console.log('[CocinaMóvil-Budgets] Presupuesto eliminado:', id)
  return true
}
