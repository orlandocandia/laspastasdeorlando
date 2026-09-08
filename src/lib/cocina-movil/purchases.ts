/**
 * ============================================================
 * Cocina Móvil — Store de Compras (demo)
 * ============================================================
 * Modelo master-detail: Purchase (compra) + PurchaseItem (items).
 * Una compra tiene un proveedor, opcionalmente un lugar, fecha,
 * número de factura, observaciones, y una lista de items (materias
 * primas o insumos con cantidad, unidad y precio).
 * ============================================================
 */
import crypto from 'crypto'
import { getSupplierById } from '@/lib/cocina-movil/suppliers'
import { getPlaceById } from '@/lib/cocina-movil/places'
import { getIngredientById, type CmUnit as CmIngredientUnit } from '@/lib/cocina-movil/ingredients'
import { getSupplyById, type CmSupplyUnit } from '@/lib/cocina-movil/supplies'

export interface CmPurchaseItem {
  id: string
  purchaseId: string
  itemType: 'ingredient' | 'supply' // materia prima o insumo
  itemId: string | null
  itemName: string // nombre del producto (snapshot para histórico)
  quantity: number
  unit: string
  pricePerUnit: number
  subtotal: number // quantity * pricePerUnit
}

export interface CmPurchaseRecord {
  id: string
  supplierId: string
  supplierName: string // snapshot
  placeId: string | null
  placeName: string | null // snapshot
  purchaseDate: number // epoch ms
  invoiceNumber: string | null
  observations: string | null
  items: CmPurchaseItem[]
  total: number // suma de subtotales
  createdAt: number
  updatedAt: number
}

export interface CmPurchaseInput {
  supplierId: string
  placeId?: string | null
  purchaseDate?: number
  invoiceNumber?: string | null
  observations?: string | null
  items: Array<{
    itemType: 'ingredient' | 'supply'
    itemId: string
    quantity: number
    unit: string
    pricePerUnit: number
  }>
}

let purchasesStore: Map<string, CmPurchaseRecord> = new Map()

function seedDemoPurchases() {
  if (purchasesStore.size > 0) return
  const now = Date.now()
  const p1: CmPurchaseRecord = {
    id: 'purchase-1',
    supplierId: 'sup-1',
    supplierName: 'Distribuidora Misiones',
    placeId: 'place-1',
    placeName: 'Cocina Central',
    purchaseDate: now - 86400000 * 3, // hace 3 días
    invoiceNumber: 'A-0001-00001234',
    observations: 'Compra semanal de harina y carne',
    items: [
      { id: 'pi-1', purchaseId: 'purchase-1', itemType: 'ingredient', itemId: 'ing-1', itemName: 'Harina 000', quantity: 10, unit: 'kg', pricePerUnit: 450, subtotal: 4500 },
      { id: 'pi-2', purchaseId: 'purchase-1', itemType: 'ingredient', itemId: 'ing-2', itemName: 'Carne Molida', quantity: 5, unit: 'kg', pricePerUnit: 3200, subtotal: 16000 },
    ],
    total: 20500,
    createdAt: now - 86400000 * 3,
    updatedAt: now - 86400000 * 3,
  }
  const p2: CmPurchaseRecord = {
    id: 'purchase-2',
    supplierId: 'sup-3',
    supplierName: 'Envases Posadas SA',
    placeId: 'place-1',
    placeName: 'Cocina Central',
    purchaseDate: now - 86400000 * 1, // ayer
    invoiceNumber: 'B-0002-00005678',
    observations: null,
    items: [
      { id: 'pi-3', purchaseId: 'purchase-2', itemType: 'supply', itemId: 'sup-1', itemName: 'Bandejas de Aluminio', quantity: 3, unit: 'paquete', pricePerUnit: 2500, subtotal: 7500 },
      { id: 'pi-4', purchaseId: 'purchase-2', itemType: 'supply', itemId: 'sup-3', itemName: 'Film Polietileno', quantity: 2, unit: 'rollo', pricePerUnit: 800, subtotal: 1600 },
    ],
    total: 9100,
    createdAt: now - 86400000 * 1,
    updatedAt: now - 86400000 * 1,
  }
  purchasesStore.set(p1.id, p1)
  purchasesStore.set(p2.id, p2)
}
seedDemoPurchases()

/**
 * Lista compras con filtros opcionales.
 */
export function listPurchases(options?: {
  search?: string
  supplierId?: string | null
  placeId?: string | null
  dateFrom?: number | null
  dateTo?: number | null
  sortBy?: 'purchaseDate' | 'total' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { purchases: CmPurchaseRecord[]; total: number; page: number; pageSize: number } {
  const {
    search,
    supplierId,
    placeId,
    dateFrom,
    dateTo,
    sortBy = 'purchaseDate',
    sortOrder = 'desc',
    page = 1,
    pageSize = 50,
  } = options || {}

  let items = Array.from(purchasesStore.values())

  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter(
      (p) =>
        p.supplierName.toLowerCase().includes(q) ||
        (p.placeName || '').toLowerCase().includes(q) ||
        (p.invoiceNumber || '').toLowerCase().includes(q) ||
        p.items.some((i) => i.itemName.toLowerCase().includes(q))
    )
  }

  if (supplierId) items = items.filter((p) => p.supplierId === supplierId)
  if (placeId) items = items.filter((p) => p.placeId === placeId)
  if (dateFrom) items = items.filter((p) => p.purchaseDate >= dateFrom)
  if (dateTo) items = items.filter((p) => p.purchaseDate <= dateTo)

  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'purchaseDate') cmp = a.purchaseDate - b.purchaseDate
    else if (sortBy === 'total') cmp = a.total - b.total
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    return sortOrder === 'desc' ? -cmp : cmp
  })

  const total = items.length
  const start = (page - 1) * pageSize
  return { purchases: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getPurchaseById(id: string): CmPurchaseRecord | null {
  return purchasesStore.get(id) || null
}

/**
 * Crea una nueva compra con items.
 * Valida que el proveedor exista y que cada item referencie un producto válido.
 */
export function createPurchase(input: CmPurchaseInput): CmPurchaseRecord {
  if (!input.supplierId) throw new Error('El proveedor es obligatorio')
  const supplier = getSupplierById(input.supplierId)
  if (!supplier) throw new Error('El proveedor no existe')

  let place: ReturnType<typeof getPlaceById> = null
  if (input.placeId) {
    place = getPlaceById(input.placeId)
    if (!place) throw new Error('El lugar no existe')
  }

  if (!input.items || input.items.length === 0) {
    throw new Error('La compra debe tener al menos un item')
  }

  // Validar y construir items
  const now = Date.now()
  const items: CmPurchaseItem[] = input.items.map((item) => {
    let itemName = 'Producto desconocido'
    if (item.itemType === 'ingredient') {
      const ing = getIngredientById(item.itemId)
      if (!ing) throw new Error(`Materia prima no encontrada: ${item.itemId}`)
      itemName = ing.name
    } else if (item.itemType === 'supply') {
      const sup = getSupplyById(item.itemId)
      if (!sup) throw new Error(`Insumo no encontrado: ${item.itemId}`)
      itemName = sup.name
    }
    const subtotal = Number(item.quantity) * Number(item.pricePerUnit)
    return {
      id: `pi-${crypto.randomBytes(4).toString('hex')}`,
      purchaseId: '', // se setea abajo
      itemType: item.itemType,
      itemId: item.itemId,
      itemName,
      quantity: Number(item.quantity),
      unit: item.unit,
      pricePerUnit: Number(item.pricePerUnit),
      subtotal,
    }
  })

  const id = `purchase-${crypto.randomBytes(6).toString('hex')}`
  items.forEach((it) => (it.purchaseId = id))

  const total = items.reduce((sum, it) => sum + it.subtotal, 0)

  const purchase: CmPurchaseRecord = {
    id,
    supplierId: input.supplierId,
    supplierName: supplier.name,
    placeId: input.placeId || null,
    placeName: place?.name || null,
    purchaseDate: input.purchaseDate || now,
    invoiceNumber: input.invoiceNumber?.trim() || null,
    observations: input.observations?.trim() || null,
    items,
    total,
    createdAt: now,
    updatedAt: now,
  }

  purchasesStore.set(id, purchase)
  console.log('[CocinaMóvil-Purchases] Compra creada:', id, 'Total:', total)
  return purchase
}

/**
 * Actualiza una compra (incluyendo items).
 */
export function updatePurchase(id: string, updates: Partial<CmPurchaseInput>): CmPurchaseRecord | null {
  const p = purchasesStore.get(id)
  if (!p) return null

  if (updates.supplierId) {
    const supplier = getSupplierById(updates.supplierId)
    if (!supplier) throw new Error('El proveedor no existe')
    p.supplierId = updates.supplierId
    p.supplierName = supplier.name
  }
  if (updates.placeId !== undefined) {
    if (updates.placeId) {
      const place = getPlaceById(updates.placeId)
      if (!place) throw new Error('El lugar no existe')
      p.placeId = updates.placeId
      p.placeName = place.name
    } else {
      p.placeId = null
      p.placeName = null
    }
  }
  if (updates.purchaseDate !== undefined) p.purchaseDate = updates.purchaseDate
  if (updates.invoiceNumber !== undefined) p.invoiceNumber = updates.invoiceNumber?.trim() || null
  if (updates.observations !== undefined) p.observations = updates.observations?.trim() || null

  if (updates.items !== undefined) {
    if (updates.items.length === 0) throw new Error('La compra debe tener al menos un item')
    p.items = updates.items.map((item) => {
      let itemName = 'Producto desconocido'
      if (item.itemType === 'ingredient') {
        const ing = getIngredientById(item.itemId)
        if (!ing) throw new Error(`Materia prima no encontrada: ${item.itemId}`)
        itemName = ing.name
      } else {
        const sup = getSupplyById(item.itemId)
        if (!sup) throw new Error(`Insumo no encontrado: ${item.itemId}`)
        itemName = sup.name
      }
      const subtotal = Number(item.quantity) * Number(item.pricePerUnit)
      return {
        id: `pi-${crypto.randomBytes(4).toString('hex')}`,
        purchaseId: id,
        itemType: item.itemType,
        itemId: item.itemId,
        itemName,
        quantity: Number(item.quantity),
        unit: item.unit,
        pricePerUnit: Number(item.pricePerUnit),
        subtotal,
      }
    })
    p.total = p.items.reduce((sum, it) => sum + it.subtotal, 0)
  }

  p.updatedAt = Date.now()
  purchasesStore.set(id, p)
  console.log('[CocinaMóvil-Purchases] Compra actualizada:', id)
  return p
}

export function deletePurchase(id: string): boolean {
  const p = purchasesStore.get(id)
  if (!p) return false
  purchasesStore.delete(id)
  console.log('[CocinaMóvil-Purchases] Compra eliminada:', id)
  return true
}
