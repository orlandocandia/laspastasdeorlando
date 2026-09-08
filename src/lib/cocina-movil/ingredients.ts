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

export interface CmIngredientRecord {
  id: string
  name: string
  description: string | null
  category: CmIngredientCategory | null
  purchaseUnit: CmUnit
  purchasePrice: number
  gramsPerUnit: number | null
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
  purchaseUnit: CmUnit
  purchasePrice: number
  gramsPerUnit?: number | null
  image?: string | null
  supplierId?: string | null
  isActive?: boolean
}

let ingredientsStore: Map<string, CmIngredientRecord> = new Map()

function seedDemoIngredients() {
  if (ingredientsStore.size > 0) return
  const now = Date.now()
  const demos: CmIngredientRecord[] = [
    { id: 'ing-1', name: 'Harina 000', description: 'Harina de trigo para pastas', category: 'harinas', purchaseUnit: 'kg', purchasePrice: 450, gramsPerUnit: 1000, image: null, supplierId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'ing-2', name: 'Carne Molida', description: 'Carne molida común', category: 'carnes', purchaseUnit: 'kg', purchasePrice: 3200, gramsPerUnit: 1000, image: null, supplierId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'ing-3', name: 'Queso Mozzarella', description: 'Muzzarella barra', category: 'lacteos', purchaseUnit: 'kg', purchasePrice: 2800, gramsPerUnit: 1000, image: null, supplierId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'ing-4', name: 'Huevos', description: 'Huevos frescos', category: 'otros', purchaseUnit: 'docena', purchasePrice: 1800, gramsPerUnit: 600, image: null, supplierId: null, isActive: true, createdAt: now, updatedAt: now },
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
  if (!input.purchasePrice || input.purchasePrice < 0) throw new Error('El precio debe ser mayor o igual a 0')
  const now = Date.now()
  const id = `ing-${crypto.randomBytes(6).toString('hex')}`
  const ing: CmIngredientRecord = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category: input.category || null,
    purchaseUnit: input.purchaseUnit,
    purchasePrice: Number(input.purchasePrice),
    gramsPerUnit: input.gramsPerUnit ? Number(input.gramsPerUnit) : null,
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
