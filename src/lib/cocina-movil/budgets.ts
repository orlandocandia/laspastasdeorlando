/**
 * ============================================================
 * Cocina Móvil — Store de Presupuestos (demo)
 * ============================================================
 * Cotiza recetas a clientes con cálculo de márgenes de ganancia.
 * Soporta múltiples items (recetas) por presupuesto.
 * Flujo de estados: borrador → enviado → aprobado | rechazado
 * ============================================================
 */
import crypto from 'crypto'
import { getRecipeById } from '@/lib/cocina-movil/recipes'

export type CmBudgetStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado'

// ============================================================
// Tipos: Items de presupuesto
// ============================================================

export interface CmBudgetItem {
  id: string
  budgetId: string
  recipeId: string
  recipeTitle: string // snapshot
  quantity: number
  unitPrice: number // precio de venta
  costPerUnit: number // costo de producción (snapshot from recipe.costPerServing)
  subtotal: number // quantity × unitPrice (auto)
  costSubtotal: number // quantity × costPerUnit (auto)
}

export interface CmBudgetItemInput {
  recipeId: string
  quantity: number
  unitPrice: number
}

// ============================================================
// Tipos: Presupuesto
// ============================================================

export interface CmBudgetRecord {
  id: string
  // Datos generales
  budgetDate: number
  clientName: string | null
  validityDays: number | null
  budgetNumber: string | null
  observations: string | null
  // Items (multi-receta)
  items: CmBudgetItem[]
  // Cálculos (auto)
  totalCost: number // suma de costSubtotal de items
  subtotal: number // suma de subtotal de items (antes de descuento)
  discountType: 'percentage' | 'fixed' | null
  discountValue: number | null
  discountAmount: number // calculado
  taxRate: number | null // ej: 21 para 21% IVA
  taxAmount: number // calculado
  totalPrice: number // subtotal - discountAmount + taxAmount
  profit: number // totalPrice - totalCost
  profitPercentage: number // (profit / totalPrice) × 100
  status: CmBudgetStatus
  clientOrderId: string | null // ID del Pedido de Cliente generado desde el presupuesto
  createdAt: number
  updatedAt: number
  // Legacy fields (mantenidos para compatibilidad con código existente
  // que referencia budget.recipeId, budget.servings, etc.)
  recipeId: string // = items[0]?.recipeId || ''
  recipeTitle: string // = items[0]?.recipeTitle || ''
  recipeCostPerServing: number // = items[0]?.costPerUnit || 0
  servings: number // = items[0]?.quantity || 0
  pricePerServing: number // = items[0]?.unitPrice || 0
}

export interface CmBudgetInput {
  clientName?: string | null
  budgetDate?: number
  validityDays?: number | null
  budgetNumber?: string | null
  observations?: string | null
  items: CmBudgetItemInput[]
  discountType?: 'percentage' | 'fixed' | null
  discountValue?: number | null
  taxRate?: number | null
}

let budgetsStore: Map<string, CmBudgetRecord> = new Map()

// ============================================================
// Cálculos automáticos
// ============================================================

function buildItems(inputItems: CmBudgetItemInput[], budgetId: string): CmBudgetItem[] {
  return (inputItems || []).map((item) => {
    const recipe = getRecipeById(item.recipeId)
    if (!recipe) throw new Error(`La receta no existe: ${item.recipeId}`)
    const qty = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    const costPerUnit = recipe.costPerServing
    return {
      id: `bi-${crypto.randomBytes(4).toString('hex')}`,
      budgetId,
      recipeId: item.recipeId,
      recipeTitle: recipe.title,
      quantity: qty,
      unitPrice,
      costPerUnit,
      subtotal: qty * unitPrice,
      costSubtotal: qty * costPerUnit,
    }
  })
}

function computeTotals(items: CmBudgetItem[], discountType: 'percentage' | 'fixed' | null, discountValue: number | null, taxRate: number | null) {
  const totalCost = items.reduce((sum, it) => sum + it.costSubtotal, 0)
  const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0)

  // Descuento
  let discountAmount = 0
  if (discountType === 'percentage' && discountValue && discountValue > 0) {
    discountAmount = subtotal * (discountValue / 100)
  } else if (discountType === 'fixed' && discountValue && discountValue > 0) {
    discountAmount = Math.min(discountValue, subtotal)
  }

  const afterDiscount = subtotal - discountAmount

  // Impuesto (IVA) sobre el precio con descuento
  let taxAmount = 0
  if (taxRate && taxRate > 0) {
    taxAmount = afterDiscount * (taxRate / 100)
  }

  const totalPrice = afterDiscount + taxAmount
  const profit = totalPrice - totalCost
  const profitPercentage = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

  return { totalCost, subtotal, discountAmount, taxAmount, totalPrice, profit, profitPercentage }
}

// ============================================================
// Seed (demo)
// ============================================================

function seedDemoBudgets() {
  if (budgetsStore.size > 0) return
  const now = Date.now()
  const recipe1 = getRecipeById('recipe-1') // Sorrentinos
  const recipe2 = getRecipeById('recipe-2') // Ravioles

  if (recipe1) {
    const items: CmBudgetItem[] = [{
      id: 'bi-seed-1',
      budgetId: 'budget-1',
      recipeId: 'recipe-1',
      recipeTitle: recipe1.title,
      quantity: 50,
      unitPrice: 1200,
      costPerUnit: recipe1.costPerServing,
      subtotal: 60000,
      costSubtotal: recipe1.costPerServing * 50,
    }]
    const totals = computeTotals(items, null, null, null)
    const b1: CmBudgetRecord = {
      id: 'budget-1',
      budgetDate: now - 86400000 * 3,
      clientName: 'Restaurant La Esquina',
      validityDays: 15,
      budgetNumber: null,
      observations: 'Presupuesto para evento del sábado',
      items,
      ...totals,
      status: 'enviado',
      clientOrderId: null,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 2,
      // Legacy
      recipeId: 'recipe-1',
      recipeTitle: recipe1.title,
      recipeCostPerServing: recipe1.costPerServing,
      servings: 50,
      pricePerServing: 1200,
    }
    budgetsStore.set(b1.id, b1)
  }

  if (recipe2) {
    const items: CmBudgetItem[] = [{
      id: 'bi-seed-2',
      budgetId: 'budget-2',
      recipeId: 'recipe-2',
      recipeTitle: recipe2.title,
      quantity: 30,
      unitPrice: 1500,
      costPerUnit: recipe2.costPerServing,
      subtotal: 45000,
      costSubtotal: recipe2.costPerServing * 30,
    }]
    const totals = computeTotals(items, null, null, null)
    const b2: CmBudgetRecord = {
      id: 'budget-2',
      budgetDate: now - 86400000 * 1,
      clientName: 'Familia González',
      validityDays: 30,
      budgetNumber: null,
      observations: 'Catering para cumpleaños',
      items,
      ...totals,
      status: 'borrador',
      clientOrderId: null,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
      // Legacy
      recipeId: 'recipe-2',
      recipeTitle: recipe2.title,
      recipeCostPerServing: recipe2.costPerServing,
      servings: 30,
      pricePerServing: 1500,
    }
    budgetsStore.set(b2.id, b2)
  }
}
seedDemoBudgets()

// ============================================================
// Listar
// ============================================================

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
    items = items.filter((b) =>
      b.recipeTitle.toLowerCase().includes(q) ||
      (b.clientName || '').toLowerCase().includes(q) ||
      b.items.some((it) => it.recipeTitle.toLowerCase().includes(q))
    )
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

// ============================================================
// Crear
// ============================================================

export function createBudget(input: CmBudgetInput): CmBudgetRecord {
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error('Debe agregar al menos un item')
  for (const it of input.items) {
    if (!it.recipeId) throw new Error('Todos los items deben tener una receta')
    if (!it.quantity || it.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0')
    if (it.unitPrice < 0) throw new Error('El precio no puede ser negativo')
  }

  const now = Date.now()
  const id = `budget-${crypto.randomBytes(6).toString('hex')}`
  const items = buildItems(input.items, id)
  const totals = computeTotals(items, input.discountType || null, input.discountValue ?? null, input.taxRate ?? null)
  const firstItem = items[0]

  const budget: CmBudgetRecord = {
    id,
    budgetDate: input.budgetDate || now,
    clientName: input.clientName?.trim() || null,
    validityDays: input.validityDays ?? null,
    budgetNumber: input.budgetNumber?.trim() || null,
    observations: input.observations?.trim() || null,
    items,
    ...totals,
    status: 'borrador',
    clientOrderId: null,
    createdAt: now,
    updatedAt: now,
    // Legacy
    recipeId: firstItem?.recipeId || '',
    recipeTitle: firstItem?.recipeTitle || '',
    recipeCostPerServing: firstItem?.costPerUnit || 0,
    servings: firstItem?.quantity || 0,
    pricePerServing: firstItem?.unitPrice || 0,
  }
  budgetsStore.set(id, budget)
  console.log('[CocinaMóvil-Budgets] Presupuesto creado:', id, 'Items:', items.length, 'Total:', totals.totalPrice)
  return budget
}

// ============================================================
// Actualizar
// ============================================================

export function updateBudget(id: string, updates: Partial<CmBudgetInput>): CmBudgetRecord | null {
  const b = budgetsStore.get(id)
  if (!b) return null
  if (b.status !== 'borrador') throw new Error('Solo se pueden editar presupuestos en borrador')

  if (updates.clientName !== undefined) b.clientName = updates.clientName?.trim() || null
  if (updates.budgetDate !== undefined) b.budgetDate = updates.budgetDate
  if (updates.validityDays !== undefined) b.validityDays = updates.validityDays
  if (updates.budgetNumber !== undefined) b.budgetNumber = updates.budgetNumber?.trim() || null
  if (updates.observations !== undefined) b.observations = updates.observations?.trim() || null

  // Rebuild items if provided
  let items = b.items
  if (Array.isArray(updates.items) && updates.items.length > 0) {
    items = buildItems(updates.items, b.id)
    b.items = items
  }

  // Recalcular totales
  const discountType = updates.discountType !== undefined ? (updates.discountType || null) : b.discountType
  const discountValue = updates.discountValue !== undefined ? updates.discountValue : b.discountValue
  const taxRate = updates.taxRate !== undefined ? updates.taxRate : b.taxRate
  const totals = computeTotals(items, discountType, discountValue, taxRate)
  Object.assign(b, totals)
  b.discountType = discountType
  b.discountValue = discountValue
  b.taxRate = taxRate

  // Update legacy fields from first item
  const firstItem = items[0]
  if (firstItem) {
    b.recipeId = firstItem.recipeId
    b.recipeTitle = firstItem.recipeTitle
    b.recipeCostPerServing = firstItem.costPerUnit
    b.servings = firstItem.quantity
    b.pricePerServing = firstItem.unitPrice
  }

  b.updatedAt = Date.now()
  budgetsStore.set(id, b)
  console.log('[CocinaMóvil-Budgets] Presupuesto actualizado:', id)
  return b
}

// ============================================================
// Cambiar estado
// ============================================================

export function setBudgetStatus(id: string, status: CmBudgetStatus): CmBudgetRecord | null {
  const b = budgetsStore.get(id)
  if (!b) return null
  b.status = status
  b.updatedAt = Date.now()
  budgetsStore.set(id, b)
  console.log('[CocinaMóvil-Budgets] Estado cambiado:', id, '→', status)
  return b
}

// ============================================================
// Eliminar
// ============================================================

export function deleteBudget(id: string): boolean {
  const b = budgetsStore.get(id)
  if (!b) return false
  if (b.status === 'enviado' || b.status === 'aprobado') throw new Error('No se puede eliminar un presupuesto enviado o aprobado')
  budgetsStore.delete(id)
  console.log('[CocinaMóvil-Budgets] Presupuesto eliminado:', id)
  return true
}
