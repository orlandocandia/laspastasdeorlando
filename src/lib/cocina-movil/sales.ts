/**
 * ============================================================
 * Cocina Móvil — Store de Ventas (demo)
 * ============================================================
 * Registra ventas con múltiples items (recetas) + cálculo de
 * márgenes, descuentos e impuestos.
 * Genera números de ticket únicos para impresión térmica.
 * ============================================================
 */
import crypto from 'crypto'
import { getRecipeById } from '@/lib/cocina-movil/recipes'
import { getPlaceById } from '@/lib/cocina-movil/places'

// ============================================================
// Tipos: Items de venta
// ============================================================

export interface CmSaleItem {
  id: string
  saleId: string
  recipeId: string
  recipeTitle: string // snapshot
  quantity: number
  unitPrice: number // precio de venta
  costPerUnit: number // costo de producción (snapshot from recipe.costPerServing)
  subtotal: number // quantity × unitPrice (auto)
  costSubtotal: number // quantity × costPerUnit (auto)
}

export interface CmSaleItemInput {
  recipeId: string
  quantity: number
  unitPrice: number
}

// ============================================================
// Tipos: Venta
// ============================================================

export interface CmSaleRecord {
  id: string
  ticketNumber: string // ej: "CM-000001"
  // Datos generales
  saleDate: number
  placeId: string
  placeName: string // snapshot
  clientName: string | null
  invoiceNumber: string | null
  paymentMethod: string
  observations: string | null
  // Items (multi-receta)
  items: CmSaleItem[]
  // Cálculos (auto)
  totalCost: number // suma de costSubtotal de items
  subtotalPrice: number // suma de subtotal de items (antes de descuento)
  discountType: 'percentage' | 'fixed' | null
  discountValue: number | null
  discountAmount: number // calculado
  taxRate: number | null // ej: 21 para 21% IVA
  taxAmount: number // calculado
  totalPrice: number // subtotalPrice - discountAmount + taxAmount
  profit: number // totalPrice - totalCost
  profitPercentage: number // (profit / totalPrice) × 100
  createdAt: number
  updatedAt: number
  // Legacy fields (mantenidos para compatibilidad con código existente
  // que referencia sale.recipeId, sale.quantity, sale.unitPrice, etc.)
  recipeId: string // = items[0]?.recipeId || ''
  recipeTitle: string // = items[0]?.recipeTitle || ''
  quantity: number // = items[0]?.quantity || 0
  unitPrice: number // = items[0]?.unitPrice || 0
  costPerUnit: number // = items[0]?.costPerUnit || 0
}

export interface CmSaleInput {
  placeId: string
  clientName?: string | null
  invoiceNumber?: string | null
  paymentMethod?: string
  saleDate?: number
  observations?: string | null
  items: CmSaleItemInput[]
  discountType?: 'percentage' | 'fixed' | null
  discountValue?: number | null
  taxRate?: number | null
}

let salesStore: Map<string, CmSaleRecord> = new Map()
let ticketCounter = 0

function generateTicketNumber(): string {
  ticketCounter++
  return `CM-${String(ticketCounter).padStart(6, '0')}`
}

// ============================================================
// Cálculos automáticos
// ============================================================

function buildItems(inputItems: CmSaleItemInput[], saleId: string): CmSaleItem[] {
  return (inputItems || []).map((item) => {
    const recipe = getRecipeById(item.recipeId)
    if (!recipe) throw new Error(`La receta no existe: ${item.recipeId}`)
    const qty = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    const costPerUnit = recipe.costPerServing
    return {
      id: `si-${crypto.randomBytes(4).toString('hex')}`,
      saleId,
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

function computeTotals(items: CmSaleItem[], discountType: 'percentage' | 'fixed' | null, discountValue: number | null, taxRate: number | null) {
  const totalCost = items.reduce((sum, it) => sum + it.costSubtotal, 0)
  const subtotalPrice = items.reduce((sum, it) => sum + it.subtotal, 0)

  // Descuento
  let discountAmount = 0
  if (discountType === 'percentage' && discountValue && discountValue > 0) {
    discountAmount = subtotalPrice * (discountValue / 100)
  } else if (discountType === 'fixed' && discountValue && discountValue > 0) {
    discountAmount = Math.min(discountValue, subtotalPrice)
  }

  const afterDiscount = subtotalPrice - discountAmount

  // Impuesto (IVA) sobre el precio con descuento
  let taxAmount = 0
  if (taxRate && taxRate > 0) {
    taxAmount = afterDiscount * (taxRate / 100)
  }

  const totalPrice = afterDiscount + taxAmount
  const profit = totalPrice - totalCost
  const profitPercentage = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

  return { totalCost, subtotalPrice, discountAmount, taxAmount, totalPrice, profit, profitPercentage }
}

// ============================================================
// Seed (demo)
// ============================================================

function seedDemoSales() {
  if (salesStore.size > 0) return
  const now = Date.now()
  const recipe1 = getRecipeById('recipe-1')
  const recipe2 = getRecipeById('recipe-2')
  const place1 = getPlaceById('place-1')

  if (recipe1 && place1) {
    ticketCounter = 0
    const items: CmSaleItem[] = [{
      id: 'si-seed-1',
      saleId: 'sale-1',
      recipeId: 'recipe-1',
      recipeTitle: recipe1.title,
      quantity: 4,
      unitPrice: 1200,
      costPerUnit: recipe1.costPerServing,
      subtotal: 4800,
      costSubtotal: recipe1.costPerServing * 4,
    }]
    const totals = computeTotals(items, null, null, null)
    const s1: CmSaleRecord = {
      id: 'sale-1',
      ticketNumber: generateTicketNumber(),
      saleDate: now - 86400000 * 1,
      placeId: 'place-1',
      placeName: place1.name,
      clientName: 'Cliente Mostrador',
      invoiceNumber: null,
      paymentMethod: 'Efectivo',
      observations: null,
      items,
      ...totals,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
      // Legacy
      recipeId: 'recipe-1',
      recipeTitle: recipe1.title,
      quantity: 4,
      unitPrice: 1200,
      costPerUnit: recipe1.costPerServing,
    }
    salesStore.set(s1.id, s1)
  }
  if (recipe2 && place1) {
    const items: CmSaleItem[] = [{
      id: 'si-seed-2',
      saleId: 'sale-2',
      recipeId: 'recipe-2',
      recipeTitle: recipe2.title,
      quantity: 6,
      unitPrice: 1500,
      costPerUnit: recipe2.costPerServing,
      subtotal: 9000,
      costSubtotal: recipe2.costPerServing * 6,
    }]
    const totals = computeTotals(items, null, null, null)
    const s2: CmSaleRecord = {
      id: 'sale-2',
      ticketNumber: generateTicketNumber(),
      saleDate: now,
      placeId: 'place-1',
      placeName: place1.name,
      clientName: null,
      invoiceNumber: null,
      paymentMethod: 'Efectivo',
      observations: 'Venta del día',
      items,
      ...totals,
      createdAt: now,
      updatedAt: now,
      // Legacy
      recipeId: 'recipe-2',
      recipeTitle: recipe2.title,
      quantity: 6,
      unitPrice: 1500,
      costPerUnit: recipe2.costPerServing,
    }
    salesStore.set(s2.id, s2)
  }
}
seedDemoSales()

// ============================================================
// Listar
// ============================================================

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
    items = items.filter((s) =>
      s.recipeTitle.toLowerCase().includes(q) ||
      (s.clientName || '').toLowerCase().includes(q) ||
      s.ticketNumber.toLowerCase().includes(q) ||
      s.items.some((it) => it.recipeTitle.toLowerCase().includes(q))
    )
  }
  if (recipeId) items = items.filter((s) => s.recipeId === recipeId || s.items.some((it) => it.recipeId === recipeId))
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

// ============================================================
// Crear
// ============================================================

export function createSale(input: CmSaleInput): CmSaleRecord {
  if (!input.placeId) throw new Error('El lugar es obligatorio')
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error('Debe agregar al menos un item')
  for (const it of input.items) {
    if (!it.recipeId) throw new Error('Todos los items deben tener una receta')
    if (!it.quantity || it.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0')
    if (it.unitPrice < 0) throw new Error('El precio no puede ser negativo')
  }

  const place = getPlaceById(input.placeId)
  if (!place) throw new Error('El lugar no existe')

  const now = Date.now()
  const id = `sale-${crypto.randomBytes(6).toString('hex')}`
  const items = buildItems(input.items, id)
  const totals = computeTotals(items, input.discountType || null, input.discountValue ?? null, input.taxRate ?? null)
  const firstItem = items[0]

  const sale: CmSaleRecord = {
    id,
    ticketNumber: generateTicketNumber(),
    saleDate: input.saleDate || now,
    placeId: input.placeId,
    placeName: place.name,
    clientName: input.clientName?.trim() || null,
    invoiceNumber: input.invoiceNumber?.trim() || null,
    paymentMethod: input.paymentMethod || 'Efectivo',
    observations: input.observations?.trim() || null,
    items,
    ...totals,
    createdAt: now,
    updatedAt: now,
    // Legacy
    recipeId: firstItem?.recipeId || '',
    recipeTitle: firstItem?.recipeTitle || '',
    quantity: firstItem?.quantity || 0,
    unitPrice: firstItem?.unitPrice || 0,
    costPerUnit: firstItem?.costPerUnit || 0,
  }
  salesStore.set(id, sale)
  console.log('[CocinaMóvil-Sales] Venta creada:', id, sale.ticketNumber, 'Items:', items.length, 'Total:', totals.totalPrice)
  return sale
}

// ============================================================
// Actualizar
// ============================================================

export function updateSale(id: string, updates: Partial<CmSaleInput>): CmSaleRecord | null {
  const s = salesStore.get(id)
  if (!s) return null
  // Solo se puede editar si fue creada hace menos de 24 horas
  if (Date.now() - s.createdAt > 86400000) throw new Error('No se puede editar una venta con más de 24 horas')

  if (updates.placeId !== undefined) {
    const place = getPlaceById(updates.placeId)
    if (!place) throw new Error('El lugar no existe')
    s.placeId = updates.placeId
    s.placeName = place.name
  }
  if (updates.clientName !== undefined) s.clientName = updates.clientName?.trim() || null
  if (updates.invoiceNumber !== undefined) s.invoiceNumber = updates.invoiceNumber?.trim() || null
  if (updates.paymentMethod !== undefined) s.paymentMethod = updates.paymentMethod || 'Efectivo'
  if (updates.saleDate !== undefined) s.saleDate = updates.saleDate
  if (updates.observations !== undefined) s.observations = updates.observations?.trim() || null

  // Rebuild items if provided
  let items = s.items
  if (Array.isArray(updates.items) && updates.items.length > 0) {
    items = buildItems(updates.items, s.id)
    s.items = items
  }

  // Recalcular totales
  const discountType = updates.discountType !== undefined ? (updates.discountType || null) : s.discountType
  const discountValue = updates.discountValue !== undefined ? updates.discountValue : s.discountValue
  const taxRate = updates.taxRate !== undefined ? updates.taxRate : s.taxRate
  const totals = computeTotals(items, discountType, discountValue, taxRate)
  Object.assign(s, totals)
  s.discountType = discountType
  s.discountValue = discountValue
  s.taxRate = taxRate

  // Update legacy fields from first item
  const firstItem = items[0]
  if (firstItem) {
    s.recipeId = firstItem.recipeId
    s.recipeTitle = firstItem.recipeTitle
    s.quantity = firstItem.quantity
    s.unitPrice = firstItem.unitPrice
    s.costPerUnit = firstItem.costPerUnit
  }

  s.updatedAt = Date.now()
  salesStore.set(id, s)
  return s
}

// ============================================================
// Eliminar
// ============================================================

export function deleteSale(id: string): boolean {
  const s = salesStore.get(id)
  if (!s) return false
  salesStore.delete(id)
  return true
}
