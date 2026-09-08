/**
 * ============================================================
 * Cocina Móvil — Store de Proveedores (demo)
 * ============================================================
 * Almacén de proveedores de materias primas e insumos.
 * Modelo: name, contactName, phone, email, address, country,
 * province, department, municipality, location (mapa), image, isActive.
 * ============================================================
 */
import crypto from 'crypto'

export interface CmSupplierRecord {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  country: string | null
  province: string | null
  department: string | null
  municipality: string | null
  location: string | null // "lat,lng"
  image: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface CmSupplierInput {
  name: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  country?: string | null
  province?: string | null
  department?: string | null
  municipality?: string | null
  location?: string | null
  image?: string | null
  isActive?: boolean
}

let suppliersStore: Map<string, CmSupplierRecord> = new Map()

function seedDemoSuppliers() {
  if (suppliersStore.size > 0) return
  const now = Date.now()
  const demos: CmSupplierRecord[] = [
    {
      id: 'sup-1',
      name: 'Distribuidora Misiones',
      contactName: 'Carlos Gómez',
      phone: '3754-555123',
      email: 'ventas@distribuidoramisiones.com',
      address: 'Ruta 12 Km 5',
      country: 'Argentina',
      province: 'Misiones',
      department: 'Capital',
      municipality: 'Posadas',
      location: '-27.3500,-55.8800',
      image: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sup-2',
      name: 'Molino del Norte',
      contactName: 'María Fernández',
      phone: '3751-444567',
      email: 'compras@molinode ltnorte.com',
      address: 'Av. industrial 456',
      country: 'Argentina',
      province: 'Misiones',
      department: 'Capital',
      municipality: 'Posadas',
      location: '-27.3800,-55.9100',
      image: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sup-3',
      name: 'Envases Posadas SA',
      contactName: 'Roberto Silva',
      phone: '3754-333890',
      email: 'info@envasesposadas.com',
      address: 'Calle Mitre 789',
      country: 'Argentina',
      province: 'Misiones',
      department: 'Capital',
      municipality: 'Posadas',
      location: '-27.3650,-55.8950',
      image: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]
  for (const sup of demos) suppliersStore.set(sup.id, sup)
}
seedDemoSuppliers()

export function listSuppliers(options?: {
  search?: string
  isActive?: boolean | 'all'
  sortBy?: 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { suppliers: CmSupplierRecord[]; total: number; page: number; pageSize: number } {
  const { search, isActive = 'all', sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(suppliersStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contactName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
    )
  }
  if (isActive !== 'all') items = items.filter((s) => s.isActive === isActive)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { suppliers: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getSupplierById(id: string): CmSupplierRecord | null {
  return suppliersStore.get(id) || null
}

export function createSupplier(input: CmSupplierInput): CmSupplierRecord {
  if (!input.name.trim()) throw new Error('El nombre es obligatorio')
  if (input.email && input.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error('El email es inválido')
  }
  const now = Date.now()
  const id = `supplier-${crypto.randomBytes(6).toString('hex')}`
  const sup: CmSupplierRecord = {
    id,
    name: input.name.trim(),
    contactName: input.contactName?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    country: input.country?.trim() || null,
    province: input.province?.trim() || null,
    department: input.department?.trim() || null,
    municipality: input.municipality?.trim() || null,
    location: input.location || null,
    image: input.image || null,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }
  suppliersStore.set(id, sup)
  console.log('[CocinaMóvil-Suppliers] Proveedor creado:', id, sup.name)
  return sup
}

export function updateSupplier(id: string, updates: Partial<CmSupplierInput>): CmSupplierRecord | null {
  const sup = suppliersStore.get(id)
  if (!sup) return null
  if (updates.name !== undefined) {
    if (!updates.name.trim()) throw new Error('El nombre es obligatorio')
    sup.name = updates.name.trim()
  }
  if (updates.contactName !== undefined) sup.contactName = updates.contactName?.trim() || null
  if (updates.phone !== undefined) sup.phone = updates.phone?.trim() || null
  if (updates.email !== undefined) {
    const email = updates.email?.trim() || null
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El email es inválido')
    sup.email = email
  }
  if (updates.address !== undefined) sup.address = updates.address?.trim() || null
  if (updates.country !== undefined) sup.country = updates.country?.trim() || null
  if (updates.province !== undefined) sup.province = updates.province?.trim() || null
  if (updates.department !== undefined) sup.department = updates.department?.trim() || null
  if (updates.municipality !== undefined) sup.municipality = updates.municipality?.trim() || null
  if (updates.location !== undefined) sup.location = updates.location || null
  if (updates.image !== undefined) sup.image = updates.image || null
  if (updates.isActive !== undefined) sup.isActive = updates.isActive
  sup.updatedAt = Date.now()
  suppliersStore.set(id, sup)
  console.log('[CocinaMóvil-Suppliers] Proveedor actualizado:', id)
  return sup
}

export function setSupplierStatus(id: string, isActive: boolean): CmSupplierRecord | null {
  const sup = suppliersStore.get(id)
  if (!sup) return null
  sup.isActive = isActive
  sup.updatedAt = Date.now()
  suppliersStore.set(id, sup)
  return sup
}

export function deleteSupplier(id: string): boolean {
  const sup = suppliersStore.get(id)
  if (!sup) return false
  suppliersStore.delete(id)
  console.log('[CocinaMóvil-Suppliers] Proveedor eliminado:', id)
  return true
}
