/**
 * ============================================================
 * Cocina Móvil — Store de Lugares (demo)
 * ============================================================
 *
 * Almacén de lugares (cocinas, carritos, locales) para el módulo
 * de ABM de la Cocina Móvil.
 *
 * Modelo completo con: identidad, contacto, domicilio, ubicación
 * (mapa), imagen rectangular y costos fijos.
 *
 * NOTA: Implementación demo con Map en memoria. En prod, migrar
 * a Prisma (modelo CmLugar).
 * ============================================================
 */

import crypto from 'crypto'

export interface CmPlaceRecord {
  id: string
  name: string
  description: string | null
  isActive: boolean

  // Datos de identidad / contacto
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null

  // Domicilio
  address: string | null
  country: string | null
  province: string | null
  department: string | null
  municipality: string | null
  location: string | null // "lat,lng"

  // Imagen (rectangular, no circular)
  image: string | null

  // Costos fijos
  isOwned: boolean
  rentCost: number | null
  utilityCost: number | null
  otherFixedCosts: number | null

  // Auditoría
  createdAt: number
  updatedAt: number
}

export interface CmPlaceInput {
  name: string
  description?: string | null
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  address?: string | null
  country?: string | null
  province?: string | null
  department?: string | null
  municipality?: string | null
  location?: string | null
  image?: string | null
  isOwned?: boolean
  rentCost?: number | null
  utilityCost?: number | null
  otherFixedCosts?: number | null
  isActive?: boolean
}

// ----- Store en memoria (demo) -----
let placesStore: Map<string, CmPlaceRecord> = new Map()

// Seed con lugares demo
function seedDemoPlaces() {
  if (placesStore.size > 0) return
  const now = Date.now()
  const cocina1: CmPlaceRecord = {
    id: 'place-1',
    name: 'Cocina Central',
    description: 'Cocina principal de producción',
    isActive: true,
    contactName: 'Orlando Candia',
    contactPhone: '3754-419324',
    contactEmail: 'orlando.candia@gmail.com',
    address: 'Av. Quaracha 1234',
    country: 'Argentina',
    province: 'Misiones',
    department: 'Capital',
    municipality: 'Posadas',
    location: '-27.3675,-55.8967',
    image: null,
    isOwned: true,
    rentCost: null,
    utilityCost: 25000,
    otherFixedCosts: null,
    createdAt: now,
    updatedAt: now,
  }
  const cocina2: CmPlaceRecord = {
    id: 'place-2',
    name: 'Carrito Móvil Centro',
    description: 'Carrito para eventos en el centro',
    isActive: true,
    contactName: 'Cocinero Demo',
    contactPhone: '3754-123456',
    contactEmail: 'proyectos.orlando.candia@gmail.com',
    address: 'Plaza 9 de Julio',
    country: 'Argentina',
    province: 'Misiones',
    department: 'Capital',
    municipality: 'Posadas',
    location: '-27.3620,-55.8920',
    image: null,
    isOwned: false,
    rentCost: 15000,
    utilityCost: 5000,
    otherFixedCosts: 2000,
    createdAt: now,
    updatedAt: now,
  }
  placesStore.set(cocina1.id, cocina1)
  placesStore.set(cocina2.id, cocina2)
}

seedDemoPlaces()

/**
 * Lista lugares con filtros opcionales.
 */
export function listPlaces(options?: {
  search?: string
  isActive?: boolean | 'all'
  sortBy?: 'name' | 'createdAt' | 'rentCost'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { places: CmPlaceRecord[]; total: number; page: number; pageSize: number } {
  const {
    search,
    isActive = 'all',
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    pageSize = 50,
  } = options || {}

  let places = Array.from(placesStore.values())

  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    places = places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.contactName || '').toLowerCase().includes(q)
    )
  }

  if (isActive !== 'all') {
    places = places.filter((p) => p.isActive === isActive)
  }

  places.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'rentCost') cmp = (a.rentCost || 0) - (b.rentCost || 0)
    return sortOrder === 'desc' ? -cmp : cmp
  })

  const total = places.length
  const start = (page - 1) * pageSize
  const paged = places.slice(start, start + pageSize)
  return { places: paged, total, page, pageSize }
}

export function getPlaceById(id: string): CmPlaceRecord | null {
  return placesStore.get(id) || null
}

/**
 * Crea un nuevo lugar.
 */
export function createPlace(input: CmPlaceInput): CmPlaceRecord {
  if (!input.name.trim()) throw new Error('El nombre es obligatorio')

  if (input.contactEmail && input.contactEmail.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail.trim())) {
      throw new Error('El email de contacto es inválido')
    }
  }

  const now = Date.now()
  const id = `place-${crypto.randomBytes(6).toString('hex')}`
  const place: CmPlaceRecord = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    isActive: input.isActive ?? true,
    contactName: input.contactName?.trim() || null,
    contactPhone: input.contactPhone?.trim() || null,
    contactEmail: input.contactEmail?.trim() || null,
    address: input.address?.trim() || null,
    country: input.country?.trim() || null,
    province: input.province?.trim() || null,
    department: input.department?.trim() || null,
    municipality: input.municipality?.trim() || null,
    location: input.location || null,
    image: input.image || null,
    isOwned: input.isOwned ?? true,
    rentCost: input.isOwned === false ? (input.rentCost ?? null) : null,
    utilityCost: input.utilityCost ?? null,
    otherFixedCosts: input.otherFixedCosts ?? null,
    createdAt: now,
    updatedAt: now,
  }
  placesStore.set(id, place)
  console.log('[CocinaMóvil-Places] Lugar creado:', id, place.name)
  return place
}

/**
 * Actualiza un lugar.
 */
export function updatePlace(id: string, updates: Partial<CmPlaceInput>): CmPlaceRecord | null {
  const p = placesStore.get(id)
  if (!p) return null

  if (updates.name !== undefined) {
    if (!updates.name.trim()) throw new Error('El nombre es obligatorio')
    p.name = updates.name.trim()
  }
  if (updates.description !== undefined) p.description = updates.description?.trim() || null
  if (updates.contactName !== undefined) p.contactName = updates.contactName?.trim() || null
  if (updates.contactPhone !== undefined) p.contactPhone = updates.contactPhone?.trim() || null
  if (updates.contactEmail !== undefined) {
    const email = updates.contactEmail?.trim() || null
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('El email de contacto es inválido')
    }
    p.contactEmail = email
  }
  if (updates.address !== undefined) p.address = updates.address?.trim() || null
  if (updates.country !== undefined) p.country = updates.country?.trim() || null
  if (updates.province !== undefined) p.province = updates.province?.trim() || null
  if (updates.department !== undefined) p.department = updates.department?.trim() || null
  if (updates.municipality !== undefined) p.municipality = updates.municipality?.trim() || null
  if (updates.location !== undefined) p.location = updates.location || null
  if (updates.image !== undefined) p.image = updates.image || null
  if (updates.isOwned !== undefined) {
    p.isOwned = updates.isOwned
    if (updates.isOwned) p.rentCost = null
  }
  if (updates.rentCost !== undefined) {
    p.rentCost = updates.rentCost === null ? null : Number(updates.rentCost)
  }
  if (updates.utilityCost !== undefined) {
    p.utilityCost = updates.utilityCost === null ? null : Number(updates.utilityCost)
  }
  if (updates.otherFixedCosts !== undefined) {
    p.otherFixedCosts = updates.otherFixedCosts === null ? null : Number(updates.otherFixedCosts)
  }
  if (updates.isActive !== undefined) p.isActive = updates.isActive

  p.updatedAt = Date.now()
  placesStore.set(id, p)
  console.log('[CocinaMóvil-Places] Lugar actualizado:', id)
  return p
}

/**
 * Activa o desactiva un lugar.
 */
export function setPlaceStatus(id: string, isActive: boolean): CmPlaceRecord | null {
  const p = placesStore.get(id)
  if (!p) return null
  p.isActive = isActive
  p.updatedAt = Date.now()
  placesStore.set(id, p)
  return p
}

/**
 * Elimina un lugar.
 */
export function deletePlace(id: string): boolean {
  const p = placesStore.get(id)
  if (!p) return false
  placesStore.delete(id)
  console.log('[CocinaMóvil-Places] Lugar eliminado:', id)
  return true
}
