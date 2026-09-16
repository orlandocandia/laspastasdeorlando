/**
 * ============================================================
 * Cocina Móvil — Store de Pedidos de Clientes (demo)
 * ============================================================
 * Gestiona pedidos de clientes con múltiples recetas.
 * Flujo: pendiente → en_preparacion → entregado → vendido
 * Conversiones: Presupuesto → Pedido, Pedido → Venta
 * ============================================================
 */
import crypto from 'crypto'
import { getRecipeById } from '@/lib/cocina-movil/recipes'

export type CmClientOrderStatus = 'pendiente' | 'en_preparacion' | 'entregado' | 'vendido' | 'cancelado'

export interface CmClientOrderItem {
  id: string
  clientOrderId: string
  recipeId: string
  recipeName: string // snapshot
  quantity: number
  unitPrice: number
  costPerUnit: number // snapshot from recipe.costPerServing
  subtotal: number // quantity × unitPrice
}

export interface CmClientOrderRecord {
  id: string
  ownerId: string
  orderNumber: string // ej: "PC-000001"
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
  orderDate: number
  expectedDeliveryDate: number | null
  status: CmClientOrderStatus
  observations: string | null
  items: CmClientOrderItem[]
  total: number
  budgetId: string | null // ID del Presupuesto que originó el pedido
  budgetNumber: string | null // N° del presupuesto (snapshot)
  saleId: string | null // ID de la Venta generada desde el pedido
  createdAt: number
  updatedAt: number
}

export interface CmClientOrderItemInput {
  recipeId: string
  quantity: number
  unitPrice: number
}

export interface CmClientOrderInput {
  ownerId?: string
  clientName?: string | null
  clientPhone?: string | null
  clientEmail?: string | null
  orderDate?: number
  expectedDeliveryDate?: number | null
  observations?: string | null
  items: CmClientOrderItemInput[]
  budgetId?: string | null
  budgetNumber?: string | null
}

let ordersStore: Map<string, CmClientOrderRecord> = new Map()
let orderCounter = 0

function generateOrderNumber(): string {
  orderCounter++
  return `PC-${String(orderCounter).padStart(6, '0')}`
}

function buildItems(inputItems: CmClientOrderItemInput[], orderId: string): CmClientOrderItem[] {
  return (inputItems || []).map((item) => {
    const recipe = getRecipeById(item.recipeId)
    if (!recipe) throw new Error(`La receta no existe: ${item.recipeId}`)
    const qty = Number(item.quantity) || 0
    const up = Number(item.unitPrice) || 0
    const costPerUnit = recipe.costPerServing
    return {
      id: `coi-${crypto.randomBytes(4).toString('hex')}`,
      clientOrderId: orderId,
      recipeId: item.recipeId,
      recipeName: recipe.title,
      quantity: qty,
      unitPrice: up,
      costPerUnit,
      subtotal: qty * up,
    }
  })
}

// ============================================================
// Seed
// ============================================================

function seedDemoOrders() {
  if (ordersStore.size > 0) return
  const now = Date.now()
  const recipe1 = getRecipeById('recipe-1')
  const recipe2 = getRecipeById('recipe-2')

  if (recipe1) {
    orderCounter = 0
    const items: CmClientOrderItem[] = [{
      id: 'coi-seed-1', clientOrderId: 'co-1', recipeId: 'recipe-1', recipeName: recipe1.title,
      quantity: 10, unitPrice: 1200, costPerUnit: recipe1.costPerServing, subtotal: 12000,
    }]
    const o1: CmClientOrderRecord = {
      id: 'co-1', ownerId: 'orlando-superadmin', orderNumber: generateOrderNumber(),
      clientName: 'Restaurant La Esquina', clientPhone: '3794112233', clientEmail: null,
      orderDate: now - 86400000 * 2, expectedDeliveryDate: now + 86400000,
      status: 'entregado', observations: 'Catering evento sábado',
      items, total: 12000, budgetId: null, budgetNumber: null, saleId: null,
      createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 1,
    }
    ordersStore.set(o1.id, o1)
  }

  if (recipe2) {
    const items: CmClientOrderItem[] = [{
      id: 'coi-seed-2', clientOrderId: 'co-2', recipeId: 'recipe-2', recipeName: recipe2.title,
      quantity: 5, unitPrice: 1500, costPerUnit: recipe2.costPerServing, subtotal: 7500,
    }]
    const o2: CmClientOrderRecord = {
      id: 'co-2', ownerId: 'orlando-superadmin', orderNumber: generateOrderNumber(),
      clientName: 'Familia González', clientPhone: null, clientEmail: null,
      orderDate: now - 86400000 * 1, expectedDeliveryDate: now + 86400000 * 3,
      status: 'pendiente', observations: null,
      items, total: 7500, budgetId: null, budgetNumber: null, saleId: null,
      createdAt: now - 86400000 * 1, updatedAt: now - 86400000 * 1,
    }
    ordersStore.set(o2.id, o2)
  }
}
seedDemoOrders()

// ============================================================
// Listar
// ============================================================

export function listClientOrders(options?: {
  search?: string
  ownerId?: string | 'all'
  status?: CmClientOrderStatus | 'all'
  dateFrom?: number | null
  dateTo?: number | null
  sortBy?: 'orderDate' | 'total' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { orders: CmClientOrderRecord[]; total: number; page: number; pageSize: number } {
  const { search, ownerId = 'all', status = 'all', dateFrom, dateTo, sortBy = 'orderDate', sortOrder = 'desc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(ordersStore.values())
  if (ownerId !== 'all') items = items.filter((o) => o.ownerId === ownerId)
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      (o.clientName || '').toLowerCase().includes(q) ||
      o.items.some((it) => it.recipeName.toLowerCase().includes(q))
    )
  }
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

export function getClientOrderById(id: string): CmClientOrderRecord | null {
  return ordersStore.get(id) || null
}

// ============================================================
// Crear
// ============================================================

export function createClientOrder(input: CmClientOrderInput): CmClientOrderRecord {
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error('Debe agregar al menos un item')
  for (const it of input.items) {
    if (!it.recipeId) throw new Error('Todos los items deben tener una receta')
    if (!it.quantity || it.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0')
  }

  const now = Date.now()
  const id = `co-${crypto.randomBytes(6).toString('hex')}`
  const items = buildItems(input.items, id)
  const total = items.reduce((sum, it) => sum + it.subtotal, 0)

  const order: CmClientOrderRecord = {
    id, ownerId: input.ownerId || 'orlando-superadmin', orderNumber: generateOrderNumber(),
    clientName: input.clientName?.trim() || null,
    clientPhone: input.clientPhone?.trim() || null,
    clientEmail: input.clientEmail?.trim() || null,
    orderDate: input.orderDate || now,
    expectedDeliveryDate: input.expectedDeliveryDate ?? null,
    status: 'pendiente',
    observations: input.observations?.trim() || null,
    items, total,
    budgetId: input.budgetId || null,
    budgetNumber: input.budgetNumber || null,
    saleId: null,
    createdAt: now, updatedAt: now,
  }
  ordersStore.set(id, order)
  console.log('[CocinaMóvil-ClientOrders] Pedido creado:', id, order.orderNumber, 'Total:', total)
  return order
}

// ============================================================
// Actualizar
// ============================================================

export function updateClientOrder(id: string, updates: Partial<CmClientOrderInput>): CmClientOrderRecord | null {
  const o = ordersStore.get(id)
  if (!o) return null
  if (o.status === 'vendido') throw new Error('No se puede editar un pedido ya vendido')

  if (updates.clientName !== undefined) o.clientName = updates.clientName?.trim() || null
  if (updates.clientPhone !== undefined) o.clientPhone = updates.clientPhone?.trim() || null
  if (updates.clientEmail !== undefined) o.clientEmail = updates.clientEmail?.trim() || null
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

export function setClientOrderStatus(id: string, status: CmClientOrderStatus): CmClientOrderRecord | null {
  const o = ordersStore.get(id)
  if (!o) return null
  o.status = status
  o.updatedAt = Date.now()
  ordersStore.set(id, o)
  return o
}

// ============================================================
// Marcar como vendido
// ============================================================

export function markClientOrderAsSold(id: string, saleId: string): CmClientOrderRecord | null {
  const o = ordersStore.get(id)
  if (!o) return null
  o.status = 'vendido'
  o.saleId = saleId
  o.updatedAt = Date.now()
  ordersStore.set(id, o)
  console.log('[CocinaMóvil-ClientOrders] Convertido en venta:', id, '→ sale:', saleId)
  return o
}

// ============================================================
// Eliminar
// ============================================================

export function deleteClientOrder(id: string): boolean {
  const o = ordersStore.get(id)
  if (!o) return false
  if (o.status === 'vendido') throw new Error('No se puede eliminar un pedido ya vendido')
  ordersStore.delete(id)
  return true
}
