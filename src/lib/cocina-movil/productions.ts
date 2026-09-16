/**
 * ============================================================
 * Cocina Móvil — Store de Producciones (demo)
 * ============================================================
 * Registra la elaboración de recetas con cantidad de porciones,
 * costo calculado automáticamente y flujo de estados:
 * pending → confirmed | rejected
 * ============================================================
 */
import crypto from 'crypto'
import { getRecipeById } from '@/lib/cocina-movil/recipes'
import { getPlaceById } from '@/lib/cocina-movil/places'

export type CmProductionStatus = 'pending' | 'confirmed' | 'rejected'

export interface CmProductionRecord {
  id: string
  recipeId: string
  recipeTitle: string // snapshot
  recipeCostPerServing: number // snapshot del costo al momento de crear
  placeId: string
  placeName: string // snapshot
  cookId: string | null
  cookName: string | null // snapshot
  quantity: number // porciones producidas
  cost: number // costo total = recipeCostPerServing × quantity
  status: CmProductionStatus
  observations: string | null
  rejectionReason: string | null
  createdAt: number
  updatedAt: number
}

export interface CmProductionInput {
  recipeId: string
  placeId: string
  cookId?: string | null
  cookName?: string | null
  quantity: number
  observations?: string | null
}

let productionsStore: Map<string, CmProductionRecord> = new Map()

function seedDemoProductions() {
  if (productionsStore.size > 0) return
  const now = Date.now()
  const recipe1 = getRecipeById('recipe-1') // Sorrentinos
  const recipe2 = getRecipeById('recipe-2') // Ravioles
  const place1 = getPlaceById('place-1') // Cocina Central

  if (recipe1 && place1) {
    const prod1: CmProductionRecord = {
      id: 'prod-1',
      recipeId: 'recipe-1',
      recipeTitle: recipe1.title,
      recipeCostPerServing: recipe1.costPerServing,
      placeId: 'place-1',
      placeName: place1.name,
      cookId: 'cocinero-1',
      cookName: 'Cocinero Demo',
      quantity: 20,
      cost: recipe1.costPerServing * 20,
      status: 'confirmed',
      observations: 'Producción para el almuerzo del sábado',
      rejectionReason: null,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 1,
    }
    productionsStore.set(prod1.id, prod1)
  }

  if (recipe2 && place1) {
    const prod2: CmProductionRecord = {
      id: 'prod-2',
      recipeId: 'recipe-2',
      recipeTitle: recipe2.title,
      recipeCostPerServing: recipe2.costPerServing,
      placeId: 'place-1',
      placeName: place1.name,
      cookId: 'cocinero-1',
      cookName: 'Cocinero Demo',
      quantity: 12,
      cost: recipe2.costPerServing * 12,
      status: 'pending',
      observations: 'Para entregar el domingo',
      rejectionReason: null,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
    }
    productionsStore.set(prod2.id, prod2)
  }
}
seedDemoProductions()

export function listProductions(options?: {
  search?: string
  placeId?: string | null
  status?: CmProductionStatus | 'all'
  dateFrom?: number | null
  dateTo?: number | null
  sortBy?: 'createdAt' | 'cost' | 'quantity'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { productions: CmProductionRecord[]; total: number; page: number; pageSize: number } {
  const { search, placeId, status = 'all', dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(productionsStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((p) => p.recipeTitle.toLowerCase().includes(q) || (p.cookName || '').toLowerCase().includes(q) || (p.placeName || '').toLowerCase().includes(q))
  }
  if (placeId) items = items.filter((p) => p.placeId === placeId)
  if (status !== 'all') items = items.filter((p) => p.status === status)
  if (dateFrom) items = items.filter((p) => p.createdAt >= dateFrom)
  if (dateTo) items = items.filter((p) => p.createdAt <= dateTo)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'cost') cmp = a.cost - b.cost
    else if (sortBy === 'quantity') cmp = a.quantity - b.quantity
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { productions: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getProductionById(id: string): CmProductionRecord | null {
  return productionsStore.get(id) || null
}

export function createProduction(input: CmProductionInput): CmProductionRecord {
  if (!input.recipeId) throw new Error('La receta es obligatoria')
  if (!input.placeId) throw new Error('El lugar es obligatorio')
  if (!input.quantity || input.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0')

  const recipe = getRecipeById(input.recipeId)
  if (!recipe) throw new Error('La receta no existe')

  const place = getPlaceById(input.placeId)
  if (!place) throw new Error('El lugar no existe')

  const now = Date.now()
  const id = `prod-${crypto.randomBytes(6).toString('hex')}`
  const cost = recipe.costPerServing * Number(input.quantity)

  const production: CmProductionRecord = {
    id,
    recipeId: input.recipeId,
    recipeTitle: recipe.title,
    recipeCostPerServing: recipe.costPerServing,
    placeId: input.placeId,
    placeName: place.name,
    cookId: input.cookId || null,
    cookName: input.cookName || null,
    quantity: Number(input.quantity),
    cost,
    status: 'pending',
    observations: input.observations?.trim() || null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  }
  productionsStore.set(id, production)
  console.log('[CocinaMóvil-Productions] Producción creada:', id, 'Cost:', cost)
  return production
}

export function updateProduction(id: string, updates: Partial<CmProductionInput>): CmProductionRecord | null {
  const p = productionsStore.get(id)
  if (!p) return null
  // Solo se puede editar si está pending
  if (p.status !== 'pending') throw new Error('Solo se pueden editar producciones pendientes')

  if (updates.recipeId) {
    const recipe = getRecipeById(updates.recipeId)
    if (!recipe) throw new Error('La receta no existe')
    p.recipeId = updates.recipeId
    p.recipeTitle = recipe.title
    p.recipeCostPerServing = recipe.costPerServing
  }
  if (updates.placeId) {
    const place = getPlaceById(updates.placeId)
    if (!place) throw new Error('El lugar no existe')
    p.placeId = updates.placeId
    p.placeName = place.name
  }
  if (updates.cookId !== undefined) { p.cookId = updates.cookId; p.cookName = updates.cookName || null }
  if (updates.quantity !== undefined) {
    if (updates.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0')
    p.quantity = Number(updates.quantity)
  }
  if (updates.observations !== undefined) p.observations = updates.observations?.trim() || null

  // Recalcular costo
  p.cost = p.recipeCostPerServing * p.quantity
  p.updatedAt = Date.now()
  productionsStore.set(id, p)
  console.log('[CocinaMóvil-Productions] Producción actualizada:', id)
  return p
}

export function setProductionStatus(id: string, status: CmProductionStatus, rejectionReason?: string): CmProductionRecord | null {
  if (status === 'rejected' && !rejectionReason?.trim()) throw new Error('El motivo de rechazo es obligatorio')
  const p = productionsStore.get(id)
  if (!p) return null
  p.status = status
  p.rejectionReason = status === 'rejected' ? (rejectionReason || null) : null
  p.updatedAt = Date.now()
  productionsStore.set(id, p)
  console.log('[CocinaMóvil-Productions] Estado cambiado:', id, '→', status)
  return p
}

export function deleteProduction(id: string): boolean {
  const p = productionsStore.get(id)
  if (!p) return false
  // Solo se puede eliminar si está pending o rejected
  if (p.status === 'confirmed') throw new Error('No se puede eliminar una producción confirmada')
  productionsStore.delete(id)
  console.log('[CocinaMóvil-Productions] Producción eliminada:', id)
  return true
}
