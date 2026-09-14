/**
 * ============================================================
 * Cocina Móvil — Store de Pedidos a Proveedores (demo)
 * ============================================================
 * Gestiona pedidos de materias primas e insumos a proveedores.
 * Flujo de estados: pendiente → enviado → recibido → comprado
 * Conversión: un pedido "recibido" puede convertirse en una Compra.
 * ============================================================
 */
import crypto from 'crypto'
import { getSupplierById } from '@/lib/cocina-movil/suppliers'
import { getIngredientById } from '@/lib/cocina-movil/ingredients'
import { getSupplyById } from '@/lib/cocina-movil/supplies'

export type CmPurchaseOrderStatus = 'pendiente' | 'enviado' | 'recibido' | 'comprado' | 'cancelado'

export interface CmPurchaseOrderItem {
  id: string
  purchaseOrderId: string
  itemType: 'ingredient' | 'supply'
  itemId: string
  itemName: string // snapshot
  quantity: number
  unit: string
  pricePerUnit: number
  subtotal: number // quantity × pricePerUnit
}

export interface CmPurchaseOrderRecord {
  id: string
  orderNumber: string // ej: "PP-000001"
  supplierId: string
  supplierName: string // snapshot
  orderDate: number
  expectedDeliveryDate: number | null
  status: CmPurchaseOrderStatus
  observations: string | null
  items: CmPurchaseOrderItem[]
  total: number // suma de subtotales
  purchaseId: string | null // ID de la Compra generada desde el pedido
  createdAt: number
  updatedAt: number
}

export interface CmPurchaseOrderItemInput {
  itemType: 'ingredient' | 'supply'
  itemId: string
  quantity: number
  unit: string
  pricePerUnit: number
}

export interface CmPurchaseOrderInput {
  supplierId: string
  orderDate?: number
  expectedDeliveryDate?: number | null
  observations?: string | null
  items: CmPurchaseOrderItemInput[]
}

let ordersStore: Map<string, CmPurchaseOrderRecord> = new Map()
let orderCounter = 0

function generateOrderNumber(): string {
  orderCounter++
  return `PP-${String(orderCounter).padStart(6, '0')}`
}

function buildItems(inputItems: CmPurchaseOrderItemInput[], orderId: string): CmPurchaseOrderItem[] {
  return (inputItems || []).map((item) => {
    let itemName = 'Desconocido'
    if (item.itemType === 'ingredient') {
      const ing = getIngredientById(item.itemId)
      if (ing) itemName = ing.name
    } else {
      const sup = getSupplyById(item.itemId)
      if (sup) itemName = sup.name
    }
    const qty = Number(item.quantity) || 0
    const ppu = Number(item.pricePerUnit) || 0
    return {
      id: `poi-${crypto.randomBytes(4).toString('hex')}`,
      purchaseOrderId: orderId,
      itemType: item.itemType,
      itemId: item.itemId,
      itemName,
      quantity: qty,
      unit: item.unit || 'u',
      pricePerUnit: ppu,
      subtotal: qty * ppu,
    }
  })
}

// ============================================================
// Seed (demo)
// ============================================================

function seedDemoOrders() {
  if (ordersStore.size > 0) return
  const now = Date.now()
  const supplier1 = getSupplierById('sup-1')
  const supplier2 = getSupplierById('sup-2')

  if (supplier1) {
    orderCounter = 0
    const items: CmPurchaseOrderItem[] = [
      { id: 'poi-seed-1', purchaseOrderId: 'po-1', itemType: 'ingredient', itemId: 'ing-1', itemName: 'Harina 000', quantity: 2, unit: 'bulto', pricePerUnit: 22000, subtotal: 44000 },
      { id: 'poi-seed-2', purchaseOrderId: 'po-1', itemType: 'supply', itemId: 'sup-1', itemName: 'Bandejas', quantity: 1, unit: 'paquete', pricePerUnit: 2500, subtotal: 2500 },
    ]
    const o1: CmPurchaseOrderRecord = {
      id: 'po-1',
      orderNumber: generateOrderNumber(),
      supplierId: 'sup-1',
      supplierName: supplier1.name,
      orderDate: now - 86400000 * 5,
      expectedDeliveryDate: now - 86400000 * 2,
      status: 'recibido',
      observations: 'Pedido de harina y bandejas',
      items,
      total: 46500,
      purchaseId: null,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 2,
    }
    ordersStore.set(o1.id, o1)
  }

  if (supplier2) {
    const items: CmPurchaseOrderItem[] = [
      { id: 'poi-seed-3', purchaseOrderId: 'po-2', itemType: 'ingredient', itemId: 'ing-2', itemName: 'Carne Molida', quantity: 5, unit: 'kg', pricePerUnit: 3500, subtotal: 17500 },
    ]
    const o2: CmPurchaseOrderRecord = {
      id: 'po-2',
      orderNumber: generateOrderNumber(),
      supplierId: 'sup-2',
      supplierName: supplier2.name,
      orderDate: now - 86400000 * 1,
      expectedDeliveryDate: now + 86400000 * 2,
      status: 'pendiente',
      observations: 'Carne para el finde',
      items,
      total: 17500,
      purchaseId: null,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
    }
    ordersStore.set(o2.id, o2)
  }
}
seedDemoOrders()

// ============================================================
// Listar
// ============================================================

export function listPurchaseOrders(options?: {
  search?: string
  supplierId?: string | null
  status?: CmPurchaseOrderStatus | 'all'
  dateFrom?: number | null
  dateTo?: number | null
  sortBy?: 'orderDate' | 'total' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { orders: CmPurchaseOrderRecord[]; total: number; page: number; pageSize: number } {
  const { search, supplierId, status = 'all', dateFrom, dateTo, sortBy = 'orderDate', sortOrder = 'desc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(ordersStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.supplierName.toLowerCase().includes(q) ||
      o.items.some((it) => it.itemName.toLowerCase().includes(q))
    )
  }
  if (supplierId) items = items.filter((o) => o.supplierId === supplierId)
  if (status !== 'all') items = items.filter((o) => o.status === status)
  if (dateFrom) items = items.filter((o) => o.orderDate >= dateFrom)
  if (dateTo) items = items.filter((o) => o.orderDate <= dateTo)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'orderDate') cmp = a.orderDate - b.orderDate
    else if (sortBy === 'total') cmp = a.total - b.total
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { orders: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getPurchaseOrderById(id: string): CmPurchaseOrderRecord | null {
  return ordersStore.get(id) || null
}

// ============================================================
// Crear
// ============================================================

export function createPurchaseOrder(input: CmPurchaseOrderInput): CmPurchaseOrderRecord {
  if (!input.supplierId) throw new Error('El proveedor es obligatorio')
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error('Debe agregar al menos un item')
  for (const it of input.items) {
    if (!it.itemId) throw new Error('Todos los items deben tener un producto')
    if (!it.quantity || it.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0')
  }

  const supplier = getSupplierById(input.supplierId)
  if (!supplier) throw new Error('El proveedor no existe')

  const now = Date.now()
  const id = `po-${crypto.randomBytes(6).toString('hex')}`
  const items = buildItems(input.items, id)
  const total = items.reduce((sum, it) => sum + it.subtotal, 0)

  const order: CmPurchaseOrderRecord = {
    id,
    orderNumber: generateOrderNumber(),
    supplierId: input.supplierId,
    supplierName: supplier.name,
    orderDate: input.orderDate || now,
    expectedDeliveryDate: input.expectedDeliveryDate ?? null,
    status: 'pendiente',
    observations: input.observations?.trim() || null,
    items,
    total,
    purchaseId: null,
    createdAt: now,
    updatedAt: now,
  }
  ordersStore.set(id, order)
  console.log('[CocinaMóvil-PurchaseOrders] Pedido creado:', id, order.orderNumber, 'Total:', total)
  return order
}

// ============================================================
// Actualizar
// ============================================================

export function updatePurchaseOrder(id: string, updates: Partial<CmPurchaseOrderInput>): CmPurchaseOrderRecord | null {
  const o = ordersStore.get(id)
  if (!o) return null
  if (o.status === 'comprado') throw new Error('No se puede editar un pedido ya comprado')

  if (updates.supplierId !== undefined) {
    const supplier = getSupplierById(updates.supplierId)
    if (!supplier) throw new Error('El proveedor no existe')
    o.supplierId = updates.supplierId
    o.supplierName = supplier.name
  }
  if (updates.orderDate !== undefined) o.orderDate = updates.orderDate
  if (updates.expectedDeliveryDate !== undefined) o.expectedDeliveryDate = updates.expectedDeliveryDate
  if (updates.observations !== undefined) o.observations = updates.observations?.trim() || null

  if (Array.isArray(updates.items) && updates.items.length > 0) {
    o.items = buildItems(updates.items, o.id)
  }

  o.total = o.items.reduce((sum, it) => sum + it.subtotal, 0)
  o.updatedAt = Date.now()
  ordersStore.set(id, o)
  return o
}

// ============================================================
// Cambiar estado
// ============================================================

export function setPurchaseOrderStatus(id: string, status: CmPurchaseOrderStatus): CmPurchaseOrderRecord | null {
  const o = ordersStore.get(id)
  if (!o) return null
  o.status = status
  o.updatedAt = Date.now()
  ordersStore.set(id, o)
  console.log('[CocinaMóvil-PurchaseOrders] Estado cambiado:', id, '→', status)
  return o
}

// ============================================================
// Convertir en Compra
// ============================================================

export function markPurchaseOrderAsBought(id: string, purchaseId: string): CmPurchaseOrderRecord | null {
  const o = ordersStore.get(id)
  if (!o) return null
  o.status = 'comprado'
  o.purchaseId = purchaseId
  o.updatedAt = Date.now()
  ordersStore.set(id, o)
  console.log('[CocinaMóvil-PurchaseOrders] Convertido en compra:', id, '→ purchase:', purchaseId)
  return o
}

// ============================================================
// Eliminar
// ============================================================

export function deletePurchaseOrder(id: string): boolean {
  const o = ordersStore.get(id)
  if (!o) return false
  if (o.status === 'comprado') throw new Error('No se puede eliminar un pedido ya comprado')
  ordersStore.delete(id)
  return true
}
