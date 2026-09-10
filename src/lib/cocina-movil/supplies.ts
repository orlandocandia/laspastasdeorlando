/**
 * ============================================================
 * Cocina Móvil — Store de Insumos (demo)
 * ============================================================
 * Almacén de insumos (materiales no comestibles: envases, limpieza, etc.)
 * Modelo: name, description, category, purchaseUnit, purchasePrice,
 * image, supplierId, isActive.
 * ============================================================
 */
import crypto from 'crypto'

export type CmSupplyCategory = 'envases' | 'limpieza' | 'descartables' | 'otros'
export type CmSupplyUnit = 'u' | 'm' | 'kg' | 'paquete' | 'caja' | 'rollo'
export type CmPurchaseUnitType = 'unidad' | 'caja' | 'paquete' | 'rollo' | 'kg_suelto' | 'metro_suelto'
export type CmMeasureUnit = 'u' | 'm' | 'kg' | 'cm' | 'g'
export type CmUsageUnit = 'u' | 'g' | 'cm'

export interface CmSupplyRecord {
  id: string
  name: string
  description: string | null
  category: CmSupplyCategory | null
  // Legacy (auto-calculated from new fields)
  purchaseUnit: CmSupplyUnit
  purchasePrice: number
  // New: Purchase fields
  purchaseUnitType: CmPurchaseUnitType | null
  unitsPurchased: number | null
  measurePerUnit: number | null
  measureUnit: CmMeasureUnit | null
  totalPrice: number | null
  // New: Usage fields
  usageUnit: CmUsageUnit | null
  equivalenceValue: number | null
  equivalenceUnit: CmUsageUnit | null
  // New: Auto-calculated
  pricePerPurchaseUnit: number | null
  pricePerUsageUnit: number | null
  // Common
  image: string | null
  supplierId: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface CmSupplyInput {
  name: string
  description?: string | null
  category?: CmSupplyCategory | null
  // Legacy
  purchaseUnit?: CmSupplyUnit
  purchasePrice?: number
  // New: Purchase
  purchaseUnitType?: CmPurchaseUnitType | null
  unitsPurchased?: number | null
  measurePerUnit?: number | null
  measureUnit?: CmMeasureUnit | null
  totalPrice?: number | null
  // New: Usage
  usageUnit?: CmUsageUnit | null
  equivalenceValue?: number | null
  equivalenceUnit?: CmUsageUnit | null
  // Common
  image?: string | null
  supplierId?: string | null
  isActive?: boolean
}

let suppliesStore: Map<string, CmSupplyRecord> = new Map()

function seedDemoSupplies() {
  if (suppliesStore.size > 0) return
  const now = Date.now()
  const demos: CmSupplyRecord[] = [
    { id: 'sup-1', name: 'Bandejas de Aluminio', description: 'Bandejas descartables para delivery', category: 'descartables', purchaseUnit: 'paquete', purchasePrice: 2500, image: null, supplierId: null, isActive: true, purchaseUnitType: 'paquete', unitsPurchased: 1, measurePerUnit: 100, measureUnit: 'u', totalPrice: 2500, usageUnit: 'u', equivalenceValue: null, equivalenceUnit: null, pricePerPurchaseUnit: 2500, pricePerUsageUnit: null, createdAt: now, updatedAt: now },
    { id: 'sup-2', name: 'Lavandina', description: 'Lavandina concentrada 1L', category: 'limpieza', purchaseUnit: 'u', purchasePrice: 350, image: null, supplierId: null, isActive: true, purchaseUnitType: 'unidad', unitsPurchased: 1, measurePerUnit: null, measureUnit: null, totalPrice: 350, usageUnit: 'u', equivalenceValue: null, equivalenceUnit: null, pricePerPurchaseUnit: 350, pricePerUsageUnit: null, createdAt: now, updatedAt: now },
    { id: 'sup-3', name: 'Film Polietileno', description: 'Rollo de film 30cm', category: 'envases', purchaseUnit: 'rollo', purchasePrice: 800, image: null, supplierId: null, isActive: true, purchaseUnitType: 'rollo', unitsPurchased: 1, measurePerUnit: 800, measureUnit: 'm', totalPrice: 800, usageUnit: 'cm', equivalenceValue: null, equivalenceUnit: null, pricePerPurchaseUnit: 1, pricePerUsageUnit: null, createdAt: now, updatedAt: now },
  ]
  for (const sup of demos) suppliesStore.set(sup.id, sup)
}
seedDemoSupplies()

export function listSupplies(options?: {
  search?: string
  category?: CmSupplyCategory | 'all'
  isActive?: boolean | 'all'
  sortBy?: 'name' | 'purchasePrice' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { supplies: CmSupplyRecord[]; total: number; page: number; pageSize: number } {
  const { search, category = 'all', isActive = 'all', sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(suppliesStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q))
  }
  if (category !== 'all') items = items.filter((i) => i.category === category)
  if (isActive !== 'all') items = items.filter((i) => i.isActive === isActive)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy === 'purchasePrice') cmp = a.purchasePrice - b.purchasePrice
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { supplies: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getSupplyById(id: string): CmSupplyRecord | null {
  return suppliesStore.get(id) || null
}

/**
 * Calculate pricePerPurchaseUnit and pricePerUsageUnit automatically.
 */
function calculateSupplyPrices(input: CmSupplyInput): {
  pricePerPurchaseUnit: number | null
  pricePerUsageUnit: number | null
  purchasePrice: number
  purchaseUnit: CmSupplyUnit
} {
  let pricePerPurchaseUnit: number | null = null
  let pricePerUsageUnit: number | null = null
  let purchasePrice = input.purchasePrice || 0
  let purchaseUnit = input.purchaseUnit || 'u'

  if (input.totalPrice && input.unitsPurchased) {
    const totalUnits = input.measurePerUnit
      ? Number(input.unitsPurchased) * Number(input.measurePerUnit)
      : Number(input.unitsPurchased)
    pricePerPurchaseUnit = totalUnits > 0 ? Number(input.totalPrice) / totalUnits : 0
    purchasePrice = Number(input.totalPrice) / Number(input.unitsPurchased) // legacy: price per purchase unit
  }

  // Map purchaseUnitType to legacy purchaseUnit
  if (input.purchaseUnitType) {
    const typeMap: Record<string, CmSupplyUnit> = {
      'unidad': 'u', 'caja': 'caja', 'paquete': 'paquete',
      'rollo': 'rollo', 'kg_suelto': 'kg', 'metro_suelto': 'm',
    }
    purchaseUnit = typeMap[input.purchaseUnitType] || 'u'
  }

  if (pricePerPurchaseUnit && input.equivalenceValue && input.equivalenceValue > 0) {
    pricePerUsageUnit = pricePerPurchaseUnit / Number(input.equivalenceValue)
  }

  return { pricePerPurchaseUnit, pricePerUsageUnit, purchasePrice, purchaseUnit }
}

export function createSupply(input: CmSupplyInput): CmSupplyRecord {
  if (!input.name.trim()) throw new Error('El nombre es obligatorio')
  const now = Date.now()
  const id = `sup-${crypto.randomBytes(6).toString('hex')}`
  const calc = calculateSupplyPrices(input)

  const sup: CmSupplyRecord = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category: input.category || null,
    purchaseUnit: calc.purchaseUnit,
    purchasePrice: calc.purchasePrice,
    purchaseUnitType: input.purchaseUnitType || null,
    unitsPurchased: input.unitsPurchased ? Number(input.unitsPurchased) : null,
    measurePerUnit: input.measurePerUnit ? Number(input.measurePerUnit) : null,
    measureUnit: input.measureUnit || null,
    totalPrice: input.totalPrice ? Number(input.totalPrice) : null,
    usageUnit: input.usageUnit || null,
    equivalenceValue: input.equivalenceValue ? Number(input.equivalenceValue) : null,
    equivalenceUnit: input.equivalenceUnit || null,
    pricePerPurchaseUnit: calc.pricePerPurchaseUnit,
    pricePerUsageUnit: calc.pricePerUsageUnit,
    image: input.image || null,
    supplierId: input.supplierId || null,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }
  suppliesStore.set(id, sup)
  console.log('[CocinaMóvil-Supplies] Creado:', id, sup.name)
  return sup
}

export function updateSupply(id: string, updates: Partial<CmSupplyInput>): CmSupplyRecord | null {
  const sup = suppliesStore.get(id)
  if (!sup) return null
  if (updates.name !== undefined) { if (!updates.name.trim()) throw new Error('El nombre es obligatorio'); sup.name = updates.name.trim() }
  if (updates.description !== undefined) sup.description = updates.description?.trim() || null
  if (updates.category !== undefined) sup.category = updates.category
  if (updates.image !== undefined) sup.image = updates.image || null
  if (updates.supplierId !== undefined) sup.supplierId = updates.supplierId || null
  if (updates.isActive !== undefined) sup.isActive = updates.isActive
  if (updates.purchaseUnitType !== undefined) sup.purchaseUnitType = updates.purchaseUnitType
  if (updates.unitsPurchased !== undefined) sup.unitsPurchased = updates.unitsPurchased ? Number(updates.unitsPurchased) : null
  if (updates.measurePerUnit !== undefined) sup.measurePerUnit = updates.measurePerUnit ? Number(updates.measurePerUnit) : null
  if (updates.measureUnit !== undefined) sup.measureUnit = updates.measureUnit
  if (updates.totalPrice !== undefined) sup.totalPrice = updates.totalPrice ? Number(updates.totalPrice) : null
  if (updates.usageUnit !== undefined) sup.usageUnit = updates.usageUnit
  if (updates.equivalenceValue !== undefined) sup.equivalenceValue = updates.equivalenceValue ? Number(updates.equivalenceValue) : null
  if (updates.equivalenceUnit !== undefined) sup.equivalenceUnit = updates.equivalenceUnit

  // Recalculate prices if we have the necessary data
  const calc = calculateSupplyPrices({
    purchaseUnitType: sup.purchaseUnitType,
    unitsPurchased: sup.unitsPurchased,
    measurePerUnit: sup.measurePerUnit,
    measureUnit: sup.measureUnit,
    totalPrice: sup.totalPrice,
    equivalenceValue: sup.equivalenceValue,
    equivalenceUnit: sup.equivalenceUnit,
    purchaseUnit: sup.purchaseUnit,
    purchasePrice: sup.purchasePrice,
  })
  if (calc.pricePerPurchaseUnit !== null) sup.pricePerPurchaseUnit = calc.pricePerPurchaseUnit
  if (calc.pricePerUsageUnit !== null) sup.pricePerUsageUnit = calc.pricePerUsageUnit
  sup.purchasePrice = calc.purchasePrice
  sup.purchaseUnit = calc.purchaseUnit

  sup.updatedAt = Date.now()
  suppliesStore.set(id, sup)
  return sup
}

export function setSupplyStatus(id: string, isActive: boolean): CmSupplyRecord | null {
  const sup = suppliesStore.get(id)
  if (!sup) return null
  sup.isActive = isActive
  sup.updatedAt = Date.now()
  suppliesStore.set(id, sup)
  return sup
}

export function deleteSupply(id: string): boolean {
  const sup = suppliesStore.get(id)
  if (!sup) return false
  suppliesStore.delete(id)
  return true
}
