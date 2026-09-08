/**
 * ============================================================
 * Cocina Móvil — Store de Ventas (demo)
 * ============================================================
 * Registra ventas de recetas con cálculo de márgenes.
 * Genera números de ticket únicos para impresión térmica.
 * ============================================================
 */
import crypto from 'crypto'
import { getRecipeById } from '@/lib/cocina-movil/recipes'
import { getPlaceById } from '@/lib/cocina-movil/places'

export interface CmSaleRecord {
  id: string
  ticketNumber: string // ej: "CM-000001"
  recipeId: string
  recipeTitle: string // snapshot
  placeId: string
  placeName: string // snapshot
  clientName: string | null
  quantity: number
  unitPrice: number // precio de venta
  totalPrice: number // quantity × unitPrice (auto)
  costPerUnit: number // costo de producción por unidad (snapshot from recipe)
  totalCost: number // quantity × costPerUnit (auto)
  profit: number // totalPrice - totalCost (auto)
  profitPercentage: number // (profit / totalPrice) × 100 (auto)
  saleDate: number
  observations: string | null
  paymentMethod: string
  createdAt: number
  updatedAt: number
}

export interface CmSaleInput {
  recipeId: string
  placeId: string
  clientName?: string | null
  quantity: number
  unitPrice: number
  saleDate?: number
  observations?: string | null
  paymentMethod?: string
}

let salesStore: Map<string, CmSaleRecord> = new Map()
let ticketCounter = 0

function generateTicketNumber(): string {
  ticketCounter++
  return `CM-${String(ticketCounter).padStart(6, '0')}`
}

function seedDemoSales() {
  if (salesStore.size > 0) return
  const now = Date.now()
  const recipe1 = getRecipeById('recipe-1')
  const recipe2 = getRecipeById('recipe-2')
  const place1 = getPlaceById('place-1')

  if (recipe1 && place1) {
    ticketCounter = 0
    const s1: CmSaleRecord = {
      id: 'sale-1',
      ticketNumber: generateTicketNumber(),
      recipeId: 'recipe-1',
      recipeTitle: recipe1.title,
      placeId: 'place-1',
      placeName: place1.name,
      clientName: 'Cliente Mostrador',
      quantity: 4,
      unitPrice: 1200,
      totalPrice: 4800,
      costPerUnit: recipe1.costPerServing,
      totalCost: recipe1.costPerServing * 4,
      profit: 4800 - recipe1.costPerServing * 4,
      profitPercentage: ((1200 - recipe1.costPerServing) / 1200) * 100,
      saleDate: now - 86400000 * 1,
      observations: null,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
    }
    salesStore.set(s1.id, s1)
  }
  if (recipe2 && place1) {
    const s2: CmSaleRecord = {
      id: 'sale-2',
      ticketNumber: generateTicketNumber(),
      recipeId: 'recipe-2',
      recipeTitle: recipe2.title,
      placeId: 'place-1',
      placeName: place1.name,
      clientName: null,
      quantity: 6,
      unitPrice: 1500,
      totalPrice: 9000,
      costPerUnit: recipe2.costPerServing,
      totalCost: recipe2.costPerServing * 6,
      profit: 9000 - recipe2.costPerServing * 6,
      profitPercentage: ((1500 - recipe2.costPerServing) / 1500) * 100,
      saleDate: now,
      observations: 'Venta del día',
      createdAt: now,
      updatedAt: now,
    }
    salesStore.set(s2.id, s2)
  }
}
seedDemoSales()

export function listSales(options?: {
  search?: string
  recipeId?: string | null
  placeId?: string | null
  dateFrom?: number | null
  dateTo?: number | null
  sortBy?: 'saleDate' | 'totalPrice' | 'profit'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { sales: CmSaleRecord[]; total: number; page: number; pageSize: number } {
  const { search, recipeId, placeId, dateFrom, dateTo, sortBy = 'saleDate', sortOrder = 'desc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(salesStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((s) => s.recipeTitle.toLowerCase().includes(q) || (s.clientName || '').toLowerCase().includes(q) || s.ticketNumber.toLowerCase().includes(q))
  }
  if (recipeId) items = items.filter((s) => s.recipeId === recipeId)
  if (placeId) items = items.filter((s) => s.placeId === placeId)
  if (dateFrom) items = items.filter((s) => s.saleDate >= dateFrom)
  if (dateTo) items = items.filter((s) => s.saleDate <= dateTo)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'saleDate') cmp = a.saleDate - b.saleDate
    else if (sortBy === 'totalPrice') cmp = a.totalPrice - b.totalPrice
    else if (sortBy === 'profit') cmp = a.profit - b.profit
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { sales: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getSaleById(id: string): CmSaleRecord | null {
  return salesStore.get(id) || null
}

export function createSale(input: CmSaleInput): CmSaleRecord {
  if (!input.recipeId) throw new Error('La receta es obligatoria')
  if (!input.placeId) throw new Error('El lugar es obligatorio')
  if (!input.quantity || input.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0')
  if (!input.unitPrice || input.unitPrice <= 0) throw new Error('El precio debe ser mayor a 0')

  const recipe = getRecipeById(input.recipeId)
  if (!recipe) throw new Error('La receta no existe')
  const place = getPlaceById(input.placeId)
  if (!place) throw new Error('El lugar no existe')

  const now = Date.now()
  const id = `sale-${crypto.randomBytes(6).toString('hex')}`
  const costPerUnit = recipe.costPerServing
  const totalPrice = Number(input.unitPrice) * Number(input.quantity)
  const totalCost = costPerUnit * Number(input.quantity)
  const profit = totalPrice - totalCost
  const profitPercentage = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

  const sale: CmSaleRecord = {
    id,
    ticketNumber: generateTicketNumber(),
    recipeId: input.recipeId,
    recipeTitle: recipe.title,
    placeId: input.placeId,
    placeName: place.name,
    clientName: input.clientName?.trim() || null,
    quantity: Number(input.quantity),
    unitPrice: Number(input.unitPrice),
    totalPrice,
    costPerUnit,
    totalCost,
    profit,
    profitPercentage,
    saleDate: input.saleDate || now,
    observations: input.observations?.trim() || null,
    paymentMethod: input.paymentMethod || 'Efectivo',
    createdAt: now,
    updatedAt: now,
  }
  salesStore.set(id, sale)
  console.log('[CocinaMóvil-Sales] Venta creada:', id, sale.ticketNumber, 'Total:', totalPrice)
  return sale
}

export function updateSale(id: string, updates: Partial<CmSaleInput>): CmSaleRecord | null {
  const s = salesStore.get(id)
  if (!s) return null
  // Solo se puede editar si fue creada hace menos de 24 horas
  if (Date.now() - s.createdAt > 86400000) throw new Error('No se puede editar una venta con más de 24 horas')

  if (updates.recipeId) {
    const recipe = getRecipeById(updates.recipeId)
    if (!recipe) throw new Error('La receta no existe')
    s.recipeId = updates.recipeId
    s.recipeTitle = recipe.title
    s.costPerUnit = recipe.costPerServing
  }
  if (updates.placeId) {
    const place = getPlaceById(updates.placeId)
    if (!place) throw new Error('El lugar no existe')
    s.placeId = updates.placeId
    s.placeName = place.name
  }
  if (updates.clientName !== undefined) s.clientName = updates.clientName?.trim() || null
  if (updates.quantity !== undefined) s.quantity = Number(updates.quantity)
  if (updates.unitPrice !== undefined) s.unitPrice = Number(updates.unitPrice)
  if (updates.saleDate !== undefined) s.saleDate = updates.saleDate
  if (updates.observations !== undefined) s.observations = updates.observations?.trim() || null
  if (updates.paymentMethod !== undefined) s.paymentMethod = updates.paymentMethod || 'Efectivo'

  // Recalcular
  s.totalPrice = s.unitPrice * s.quantity
  s.totalCost = s.costPerUnit * s.quantity
  s.profit = s.totalPrice - s.totalCost
  s.profitPercentage = s.totalPrice > 0 ? (s.profit / s.totalPrice) * 100 : 0

  s.updatedAt = Date.now()
  salesStore.set(id, s)
  return s
}

export function deleteSale(id: string): boolean {
  const s = salesStore.get(id)
  if (!s) return false
  salesStore.delete(id)
  return true
}
