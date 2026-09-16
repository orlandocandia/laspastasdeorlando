/**
 * ============================================================
 * Cocina Móvil — Store de Materias Primas (demo)
 * ============================================================
 * Almacén de materias primas (ingredientes) para recetas y producción.
 * Modelo: name, description, category, purchaseUnit, purchasePrice,
 * gramsPerUnit, image, supplierId, isActive.
 * ============================================================
 */
import crypto from 'crypto'

export type CmIngredientCategory = 'harinas' | 'carnes' | 'lacteos' | 'verduras' | 'especias' | 'aceites' | 'otros'
export type CmUnit = 'kg' | 'g' | 'l' | 'ml' | 'u' | 'paquete' | 'docena'
export type CmPurchaseUnitType = 'bulto' | 'caja' | 'botella' | 'unidad' | 'kg_suelto' | 'litro_suelto'
export type CmWeightUnit = 'kg' | 'g' | 'l' | 'ml'

export interface CmIngredientRecord {
  id: string
  name: string
  description: string | null
  category: CmIngredientCategory | null
  // Campos originales (mantenidos para compatibilidad)
  purchaseUnit: CmUnit
  purchasePrice: number
  gramsPerUnit: number | null
  // Nuevos campos: cálculo automático de precio
  purchaseUnitType: CmPurchaseUnitType | null
  unitsPurchased: number | null
  weightPerUnit: number | null
  weightUnit: CmWeightUnit | null
  totalPrice: number | null
  pricePerUnit: number | null
  totalGrams: number | null
  // Comunes
  image: string | null
  supplierId: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface CmIngredientInput {
  name: string
  description?: string | null
  category?: CmIngredientCategory | null
  // Campos originales
  purchaseUnit?: CmUnit
  purchasePrice?: number
  gramsPerUnit?: number | null
  // Nuevos campos
  purchaseUnitType?: CmPurchaseUnitType | null
  unitsPurchased?: number | null
  weightPerUnit?: number | null
  weightUnit?: CmWeightUnit | null
  totalPrice?: number | null
  pricePerUnit?: number | null
  totalGrams?: number | null
  // Comunes
  image?: string | null
  supplierId?: string | null
  isActive?: boolean
}


/**
 * Convierte un peso/volumen a gramos.
 * - kg → ×1000
 * - g → ×1
 * - l → ×1000 (asumiendo densidad similar al agua)
 * - ml → ×1
 */
function convertToGrams(weight: number, unit: CmWeightUnit): number {
  switch (unit) {
    case 'kg': return weight * 1000
    case 'g': return weight
    case 'l': return weight * 1000
    case 'ml': return weight
    default: return weight
  }
}

/**
 * Calcula pricePerUnit y totalGrams automáticamente.
 */
function calculateAutoFields(unitsPurchased: number, weightPerUnit: number, weightUnit: CmWeightUnit, totalPrice: number): { pricePerUnit: number; totalGrams: number } {
  const totalUnits = unitsPurchased * weightPerUnit
  const pricePerUnit = totalUnits > 0 ? totalPrice / totalUnits : 0
  const totalGrams = convertToGrams(totalUnits, weightUnit)
  return { pricePerUnit, totalGrams }
}

let ingredientsStore: Map<string, CmIngredientRecord> = new Map()

function seedDemoIngredients() {
  if (ingredientsStore.size > 0) return
  const now = Date.now()
  const demos: CmIngredientRecord[] = [
    { id: 'ing-1', name: 'Harina 000', description: 'Harina de trigo para pastas', category: 'harinas', purchaseUnit: 'kg', purchasePrice: 18, gramsPerUnit: 1000, image: null, supplierId: null, isActive: true, purchaseUnitType: 'bulto', unitsPurchased: 1, weightPerUnit: 25, weightUnit: 'kg', totalPrice: 450, pricePerUnit: 18, totalGrams: 25000, createdAt: now, updatedAt: now },
    { id: 'ing-2', name: 'Carne Molida', description: 'Carne molida común', category: 'carnes', purchaseUnit: 'kg', purchasePrice: 3200, gramsPerUnit: 1000, image: null, supplierId: null, isActive: true, purchaseUnitType: 'kg_suelto', unitsPurchased: 1, weightPerUnit: 1, weightUnit: 'kg', totalPrice: 3200, pricePerUnit: 3200, totalGrams: 1000, createdAt: now, updatedAt: now },
    { id: 'ing-3', name: 'Queso Mozzarella', description: 'Muzzarella barra', category: 'lacteos', purchaseUnit: 'kg', purchasePrice: 2800, gramsPerUnit: 1000, image: null, supplierId: null, isActive: true, purchaseUnitType: 'unidad', unitsPurchased: 1, weightPerUnit: 1, weightUnit: 'kg', totalPrice: 2800, pricePerUnit: 2800, totalGrams: 1000, createdAt: now, updatedAt: now },
    { id: 'ing-4', name: 'Huevos', description: 'Huevos frescos', category: 'otros', purchaseUnit: 'docena', purchasePrice: 150, gramsPerUnit: 50, image: null, supplierId: null, isActive: true, purchaseUnitType: 'caja', unitsPurchased: 1, weightPerUnit: 0.05, weightUnit: 'kg', totalPrice: 1800, pricePerUnit: 150, totalGrams: 50, createdAt: now, updatedAt: now },
  ]
  for (const ing of demos) ingredientsStore.set(ing.id, ing)
}
seedDemoIngredients()

export function listIngredients(options?: {
  search?: string
  category?: CmIngredientCategory | 'all'
  isActive?: boolean | 'all'
  sortBy?: 'name' | 'purchasePrice' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { ingredients: CmIngredientRecord[]; total: number; page: number; pageSize: number } {
  const { search, category = 'all', isActive = 'all', sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(ingredientsStore.values())
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
  return { ingredients: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getIngredientById(id: string): CmIngredientRecord | null {
  return ingredientsStore.get(id) || null
}

export function createIngredient(input: CmIngredientInput): CmIngredientRecord {
  if (!input.name.trim()) throw new Error('El nombre es obligatorio')
  const now = Date.now()
  const id = `ing-${crypto.randomBytes(6).toString('hex')}`

  // Calcular campos automáticos si se proporcionan los datos necesarios
  let pricePerUnit: number | null = null
  let totalGrams: number | null = null
  let purchasePrice = input.purchasePrice || 0
  let gramsPerUnit = input.gramsPerUnit ? Number(input.gramsPerUnit) : null

  if (input.unitsPurchased && input.weightPerUnit && input.weightUnit && input.totalPrice) {
    const calc = calculateAutoFields(
      Number(input.unitsPurchased),
      Number(input.weightPerUnit),
      input.weightUnit,
      Number(input.totalPrice)
    )
    pricePerUnit = calc.pricePerUnit
    totalGrams = calc.totalGrams
    // También actualizar campos legacy
    purchasePrice = pricePerUnit
    gramsPerUnit = totalGrams / Number(input.unitsPurchased)
  }

  const ing: CmIngredientRecord = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category: input.category || null,
    purchaseUnit: input.purchaseUnit || 'kg',
    purchasePrice,
    gramsPerUnit,
    purchaseUnitType: input.purchaseUnitType || null,
    unitsPurchased: input.unitsPurchased ? Number(input.unitsPurchased) : null,
    weightPerUnit: input.weightPerUnit ? Number(input.weightPerUnit) : null,
    weightUnit: input.weightUnit || null,
    totalPrice: input.totalPrice ? Number(input.totalPrice) : null,
    pricePerUnit,
    totalGrams,
    image: input.image || null,
    supplierId: input.supplierId || null,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }
  ingredientsStore.set(id, ing)
  console.log('[CocinaMóvil-Ingredients] Creado:', id, ing.name)
  return ing
}

export function updateIngredient(id: string, updates: Partial<CmIngredientInput>): CmIngredientRecord | null {
  const ing = ingredientsStore.get(id)
  if (!ing) return null
  if (updates.name !== undefined) { if (!updates.name.trim()) throw new Error('El nombre es obligatorio'); ing.name = updates.name.trim() }
  if (updates.description !== undefined) ing.description = updates.description?.trim() || null
  if (updates.category !== undefined) ing.category = updates.category
  if (updates.purchaseUnit !== undefined) ing.purchaseUnit = updates.purchaseUnit
  if (updates.purchasePrice !== undefined) ing.purchasePrice = Number(updates.purchasePrice)
  if (updates.gramsPerUnit !== undefined) ing.gramsPerUnit = updates.gramsPerUnit ? Number(updates.gramsPerUnit) : null
  if (updates.image !== undefined) ing.image = updates.image || null
  if (updates.supplierId !== undefined) ing.supplierId = updates.supplierId || null
  if (updates.isActive !== undefined) ing.isActive = updates.isActive
  if (updates.purchaseUnitType !== undefined) ing.purchaseUnitType = updates.purchaseUnitType
  if (updates.unitsPurchased !== undefined) ing.unitsPurchased = updates.unitsPurchased ? Number(updates.unitsPurchased) : null
  if (updates.weightPerUnit !== undefined) ing.weightPerUnit = updates.weightPerUnit ? Number(updates.weightPerUnit) : null
  if (updates.weightUnit !== undefined) ing.weightUnit = updates.weightUnit
  if (updates.totalPrice !== undefined) ing.totalPrice = updates.totalPrice ? Number(updates.totalPrice) : null

  // Recalcular campos automáticos si hay datos suficientes
  if (ing.unitsPurchased && ing.weightPerUnit && ing.weightUnit && ing.totalPrice) {
    const calc = calculateAutoFields(ing.unitsPurchased, ing.weightPerUnit, ing.weightUnit, ing.totalPrice)
    ing.pricePerUnit = calc.pricePerUnit
    ing.totalGrams = calc.totalGrams
    ing.purchasePrice = calc.pricePerUnit
    ing.gramsPerUnit = calc.totalGrams / ing.unitsPurchased
  }

  ing.updatedAt = Date.now()
  ingredientsStore.set(id, ing)
  return ing
}

export function setIngredientStatus(id: string, isActive: boolean): CmIngredientRecord | null {
  const ing = ingredientsStore.get(id)
  if (!ing) return null
  ing.isActive = isActive
  ing.updatedAt = Date.now()
  ingredientsStore.set(id, ing)
  return ing
}

export function deleteIngredient(id: string): boolean {
  const ing = ingredientsStore.get(id)
  if (!ing) return false
  ingredientsStore.delete(id)
  return true
}
