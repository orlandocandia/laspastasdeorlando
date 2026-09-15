/**
 * ============================================================
 * Cocina Móvil — Store de Clientes (demo)
 * ============================================================
 * Almacén de clientes para Ventas, Presupuestos y Pedidos.
 * ============================================================
 */
import crypto from 'crypto'

export interface CmClientRecord {
  id: string
  firstName: string
  lastName: string
  fullName: string // firstName + ' ' + lastName (computed)
  dni: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string | null
  province: string | null
  department: string | null
  municipality: string | null
  location: string | null // "lat,lng"
  avatar: string | null
  birthDate: number | null
  notes: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface CmClientInput {
  firstName: string
  lastName: string
  dni?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  province?: string | null
  department?: string | null
  municipality?: string | null
  location?: string | null
  avatar?: string | null
  birthDate?: number | null
  notes?: string | null
  isActive?: boolean
}

let clientsStore: Map<string, CmClientRecord> = new Map()

function seedDemoClients() {
  if (clientsStore.size > 0) return
  const now = Date.now()
  const clients: CmClientRecord[] = [
    {
      id: 'client-1', firstName: 'Restaurant', lastName: 'La Esquina',
      fullName: 'Restaurant La Esquina', dni: '30-12345678-9', phone: '3794112233',
      email: 'contacto@laesquina.com', address: 'Av. Mitre 1234', city: 'Posadas',
      country: 'Argentina', province: 'Misiones', department: 'Capital', municipality: 'Posadas',
      location: '-27.3675,-55.8967', avatar: null,
      birthDate: null, notes: 'Cliente frecuente - catering eventos',
      isActive: true, createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 5,
    },
    {
      id: 'client-2', firstName: 'Familia', lastName: 'González',
      fullName: 'Familia González', dni: '28765432', phone: '3794332211',
      email: null, address: 'Calle Alberdi 456', city: 'Posadas',
      country: 'Argentina', province: 'Misiones', department: 'Capital', municipality: 'Posadas',
      location: null, avatar: null,
      birthDate: null, notes: null,
      isActive: true, createdAt: now - 86400000 * 15, updatedAt: now - 86400000 * 2,
    },
    {
      id: 'client-3', firstName: 'María', lastName: 'Fernández',
      fullName: 'María Fernández', dni: '27111222', phone: '3764455667',
      email: 'maria@gmail.com', address: null, city: 'Garupá',
      country: 'Argentina', province: 'Misiones', department: null, municipality: null,
      location: null, avatar: null,
      birthDate: null, notes: 'Pide delivery los viernes',
      isActive: true, createdAt: now - 86400000 * 7, updatedAt: now - 86400000 * 1,
    },
    {
      id: 'client-4', firstName: 'Carlos', lastName: 'Pérez',
      fullName: 'Carlos Pérez', dni: null, phone: '3794998877',
      email: null, address: 'Barrio Centenario', city: 'Posadas',
      country: 'Argentina', province: 'Misiones', department: null, municipality: null,
      location: null, avatar: null,
      birthDate: null, notes: null,
      isActive: false, createdAt: now - 86400000 * 60, updatedAt: now - 86400000 * 10,
    },
  ]
  for (const c of clients) clientsStore.set(c.id, c)
}
seedDemoClients()

// ============================================================
// Listar
// ============================================================

export function listClients(options?: {
  search?: string
  isActive?: boolean | 'all'
  sortBy?: 'fullName' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { clients: CmClientRecord[]; total: number; page: number; pageSize: number } {
  const { search, isActive = 'all', sortBy = 'fullName', sortOrder = 'asc', page = 1, pageSize = 50 } = options || {}
  let items = Array.from(clientsStore.values())
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((c) =>
      c.fullName.toLowerCase().includes(q) ||
      (c.dni || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }
  if (isActive !== 'all') items = items.filter((c) => c.isActive === isActive)
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'fullName') cmp = a.fullName.localeCompare(b.fullName)
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = items.length
  const start = (page - 1) * pageSize
  return { clients: items.slice(start, start + pageSize), total, page, pageSize }
}

export function getClientById(id: string): CmClientRecord | null {
  return clientsStore.get(id) || null
}

// ============================================================
// Crear
// ============================================================

export function createClient(input: CmClientInput): CmClientRecord {
  if (!input.firstName?.trim()) throw new Error('El nombre es obligatorio')
  if (!input.lastName?.trim()) throw new Error('El apellido es obligatorio')
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error('El email es inválido')
  }
  const now = Date.now()
  const id = `client-${crypto.randomBytes(6).toString('hex')}`
  const client: CmClientRecord = {
    id,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    dni: input.dni?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    country: input.country?.trim() || null,
    province: input.province?.trim() || null,
    department: input.department?.trim() || null,
    municipality: input.municipality?.trim() || null,
    location: input.location || null,
    avatar: input.avatar || null,
    birthDate: input.birthDate ?? null,
    notes: input.notes?.trim() || null,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }
  clientsStore.set(id, client)
  console.log('[CocinaMóvil-Clients] Cliente creado:', id, client.fullName)
  return client
}

// ============================================================
// Actualizar
// ============================================================

export function updateClient(id: string, updates: Partial<CmClientInput>): CmClientRecord | null {
  const c = clientsStore.get(id)
  if (!c) return null
  if (updates.firstName !== undefined) {
    if (!updates.firstName.trim()) throw new Error('El nombre es obligatorio')
    c.firstName = updates.firstName.trim()
  }
  if (updates.lastName !== undefined) {
    if (!updates.lastName.trim()) throw new Error('El apellido es obligatorio')
    c.lastName = updates.lastName.trim()
  }
  c.fullName = `${c.firstName} ${c.lastName}`
  if (updates.dni !== undefined) c.dni = updates.dni?.trim() || null
  if (updates.phone !== undefined) c.phone = updates.phone?.trim() || null
  if (updates.email !== undefined) c.email = updates.email?.trim() || null
  if (updates.address !== undefined) c.address = updates.address?.trim() || null
  if (updates.city !== undefined) c.city = updates.city?.trim() || null
  if (updates.country !== undefined) c.country = updates.country?.trim() || null
  if (updates.province !== undefined) c.province = updates.province?.trim() || null
  if (updates.department !== undefined) c.department = updates.department?.trim() || null
  if (updates.municipality !== undefined) c.municipality = updates.municipality?.trim() || null
  if (updates.location !== undefined) c.location = updates.location || null
  if (updates.avatar !== undefined) c.avatar = updates.avatar || null
  if (updates.birthDate !== undefined) c.birthDate = updates.birthDate
  if (updates.notes !== undefined) c.notes = updates.notes?.trim() || null
  if (updates.isActive !== undefined) c.isActive = updates.isActive
  c.updatedAt = Date.now()
  clientsStore.set(id, c)
  return c
}

export function setClientStatus(id: string, isActive: boolean): CmClientRecord | null {
  const c = clientsStore.get(id)
  if (!c) return null
  c.isActive = isActive
  c.updatedAt = Date.now()
  clientsStore.set(id, c)
  return c
}

export function deleteClient(id: string): boolean {
  const c = clientsStore.get(id)
  if (!c) return false
  clientsStore.delete(id)
  return true
}
