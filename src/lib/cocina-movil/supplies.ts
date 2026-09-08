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

export interface CmSupplyRecord {
  id: string
  name: string
  description: string | null
  category: CmSupplyCategory | null
  purchaseUnit: CmSupplyUnit
  purchasePrice: number
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
  purchaseUnit: CmSupplyUnit
  purchasePrice: number
  image?: string | null
  supplierId?: string | null
  isActive?: boolean
}

let suppliesStore: Map<string, CmSupplyRecord> = new Map()

function seedDemoSupplies() {
  if (suppliesStore.size > 0) return
  const now = Date.now()
  const demos: CmSupplyRecord[] = [
    { id: 'sup-1', name: 'Bandejas de Aluminio', description: 'Bandejas descartables para delivery', category: 'descartables', purchaseUnit: 'paquete', purchasePrice: 2500, image: null, supplierId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'sup-2', name: 'Lavandina', description: 'Lavandina concentrada 1L', category: 'limpieza', purchaseUnit: 'u', purchasePrice: 350, image: null, supplierId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'sup-3', name: 'Film Polietileno', description: 'Rollo de film 30cm', category: 'envases', purchaseUnit: 'rollo', purchasePrice: 800, image: null, supplierId: null, isActive: true, createdAt: now, updatedAt: now },
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

export function createSupply(input: CmSupplyInput): CmSupplyRecord {
  if (!input.name.trim()) throw new Error('El nombre es obligatorio')
  if (!input.purchasePrice || input.purchasePrice < 0) throw new Error('El precio debe ser mayor o igual a 0')
  const now = Date.now()
  const id = `sup-${crypto.randomBytes(6).toString('hex')}`
  const sup: CmSupplyRecord = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category: input.category || null,
    purchaseUnit: input.purchaseUnit,
    purchasePrice: Number(input.purchasePrice),
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
  if (updates.purchaseUnit !== undefined) sup.purchaseUnit = updates.purchaseUnit
  if (updates.purchasePrice !== undefined) sup.purchasePrice = Number(updates.purchasePrice)
  if (updates.image !== undefined) sup.image = updates.image || null
  if (updates.supplierId !== undefined) sup.supplierId = updates.supplierId || null
  if (updates.isActive !== undefined) sup.isActive = updates.isActive
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
