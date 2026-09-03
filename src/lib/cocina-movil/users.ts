/**
 * ============================================================
 * Cocina Móvil — Store de Usuarios (demo)
 * ============================================================
 *
 * Modelo completo de usuario con datos personales, domicilio y
 * coordenadas de ubicación (para mapa Leaflet).
 *
 * NOTA IMPORTANTE SOBRE VERCEL SERVERLESS:
 * Esta implementación usa un Map en memoria. En Vercel Serverless,
 * cada instancia de función tiene su propia memoria, por lo que los
 * cambios (crear/editar/eliminar usuarios) NO persistirán entre
 * requests de diferentes instancias.
 *
 * Para producción real, crear el modelo CmUsuario en Prisma:
 *   model CmUsuario {
 *     id                String   @id @default(cuid())
 *     email             String   @unique
 *     password          String
 *     role              String   // "admin" | "cocinero" | "supervisor"
 *     // Datos personales
 *     firstName         String
 *     lastName          String
 *     dni               String?  @unique
 *     birthDate         DateTime?
 *     gender            String?  // "masculino" | "femenino" | "otro"
 *     maritalStatus     String?  // "soltero" | "casado" | "divorciado" | "viudo"
 *     avatar            String?
 *     // Domicilio
 *     address           String?
 *     country           String?
 *     province          String?
 *     department        String?
 *     municipality      String?
 *     location          String?  // "lat,lng" para mapa
 *     // Auditoría
 *     isActive          Boolean  @default(true)
 *     lastLoginAt       DateTime?
 *     createdAt         DateTime @default(now())
 *     updatedAt         DateTime @updatedAt
 *   }
 * ============================================================
 */

import crypto from 'crypto'

export type CmRole = 'cocinero' | 'supervisor' | 'admin'

export type CmGender = 'masculino' | 'femenino' | 'otro' | null
export type CmMaritalStatus = 'soltero' | 'casado' | 'divorciado' | 'viudo' | null

export interface CmUserRecord {
  id: string
  email: string
  role: CmRole

  // Datos personales
  firstName: string
  lastName: string
  dni: string | null
  birthDate: number | null // epoch ms
  gender: CmGender
  maritalStatus: CmMaritalStatus
  avatar: string | null

  // Domicilio
  address: string | null
  country: string | null
  province: string | null
  department: string | null
  municipality: string | null
  location: string | null // "lat,lng" formato para mapa Leaflet

  // Auditoría
  isActive: boolean
  lastLoginAt: number | null
  createdAt: number
  updatedAt: number
}

export interface CmUserWithPassword extends CmUserRecord {
  password: string
}

// Helper: nombre completo
export function getFullName(u: Pick<CmUserRecord, 'firstName' | 'lastName'>): string {
  return `${u.firstName} ${u.lastName}`.trim()
}

// Helper: obtener iniciales
export function getInitials(u: Pick<CmUserRecord, 'firstName' | 'lastName'>): string {
  const f = u.firstName?.charAt(0)?.toUpperCase() || ''
  const l = u.lastName?.charAt(0)?.toUpperCase() || ''
  return (f + l) || '?'
}

// Helper: parsear location string "lat,lng" a [lat, lng]
export function parseLocation(location: string | null): [number, number] | null {
  if (!location) return null
  const parts = location.split(',').map((s) => parseFloat(s.trim()))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts as [number, number]
  }
  return null
}

// ----- Store en memoria (demo) -----
let usersStore: Map<string, CmUserWithPassword> = new Map()

// Inicializar con usuarios demo (seed)
function seedDemoUsers() {
  if (usersStore.size > 0) return
  const now = Date.now()
  const admin: CmUserWithPassword = {
    id: 'admin-1',
    email: 'orlando.candia@gmail.com',
    role: 'admin',
    firstName: 'Orlando',
    lastName: 'Candia',
    dni: '12345678',
    birthDate: null,
    gender: 'masculino',
    maritalStatus: 'casado',
    avatar: null,
    address: 'Posadas',
    country: 'Argentina',
    province: 'Misiones',
    department: 'Capital',
    municipality: 'Posadas',
    location: '-27.3675,-55.8967',
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    password: 'admin123',
  }
  const cocinero: CmUserWithPassword = {
    id: 'cocinero-1',
    email: 'proyectos.orlando.candia@gmail.com',
    role: 'cocinero',
    firstName: 'Cocinero',
    lastName: 'Demo',
    dni: '87654321',
    birthDate: null,
    gender: null,
    maritalStatus: null,
    avatar: null,
    address: null,
    country: 'Argentina',
    province: 'Misiones',
    department: null,
    municipality: null,
    location: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    password: 'cocinero123',
  }
  usersStore.set(admin.id, admin)
  usersStore.set(cocinero.id, cocinero)
}

seedDemoUsers()

// ----- Tipos para inputs -----

export interface CmUserInput {
  // Datos personales
  firstName: string
  lastName: string
  dni?: string | null
  birthDate?: number | null
  gender?: CmGender
  maritalStatus?: CmMaritalStatus
  avatar?: string | null
  // Domicilio
  address?: string | null
  country?: string | null
  province?: string | null
  department?: string | null
  municipality?: string | null
  location?: string | null
  // Acceso
  email: string
  role: CmRole
  password?: string // obligatorio en create, opcional en update
}

/**
 * Lista todos los usuarios (sin passwords) con filtros opcionales.
 */
export function listUsers(options?: {
  search?: string
  role?: CmRole | 'all'
  isActive?: boolean | 'all'
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}): { users: CmUserRecord[]; total: number; page: number; pageSize: number } {
  const {
    search,
    role = 'all',
    isActive = 'all',
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    pageSize = 50,
  } = options || {}

  let users = Array.from(usersStore.values())

  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    users = users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.dni || '').toLowerCase().includes(q)
    )
  }

  if (role !== 'all') {
    users = users.filter((u) => u.role === role)
  }

  if (isActive !== 'all') {
    users = users.filter((u) => u.isActive === isActive)
  }

  users.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = getFullName(a).localeCompare(getFullName(b))
    else if (sortBy === 'email') cmp = a.email.localeCompare(b.email)
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'lastLoginAt') {
      cmp = (a.lastLoginAt || 0) - (b.lastLoginAt || 0)
    }
    return sortOrder === 'desc' ? -cmp : cmp
  })

  const total = users.length
  const start = (page - 1) * pageSize
  const paged = users.slice(start, start + pageSize).map(stripPassword)

  return { users: paged, total, page, pageSize }
}

export function getUserById(id: string): CmUserRecord | null {
  const u = usersStore.get(id)
  return u ? stripPassword(u) : null
}

export function getUserByEmail(email: string): CmUserRecord | null {
  const normalized = email.trim().toLowerCase()
  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === normalized) {
      return stripPassword(u)
    }
  }
  return null
}

/**
 * Crea un nuevo usuario.
 */
export function createUser(input: CmUserInput): CmUserRecord {
  const normalizedEmail = input.email.trim().toLowerCase()
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Email inválido')
  }
  if (!input.firstName.trim()) throw new Error('El nombre es obligatorio')
  if (!input.lastName.trim()) throw new Error('El apellido es obligatorio')
  if (!input.password || input.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  // DNI único si se proporciona
  if (input.dni && input.dni.trim()) {
    const dniExists = Array.from(usersStore.values()).find(
      (u) => u.dni === input.dni!.trim()
    )
    if (dniExists) throw new Error('Ya existe un usuario con ese DNI')
  }

  const existing = getUserByEmail(normalizedEmail)
  if (existing) throw new Error('Ya existe un usuario con ese email')

  const now = Date.now()
  const id = `cm-user-${crypto.randomBytes(6).toString('hex')}`
  const newUser: CmUserWithPassword = {
    id,
    email: normalizedEmail,
    role: input.role,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dni: input.dni?.trim() || null,
    birthDate: input.birthDate || null,
    gender: input.gender || null,
    maritalStatus: input.maritalStatus || null,
    avatar: input.avatar || null,
    address: input.address?.trim() || null,
    country: input.country?.trim() || null,
    province: input.province?.trim() || null,
    department: input.department?.trim() || null,
    municipality: input.municipality?.trim() || null,
    location: input.location || null,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    password: input.password,
  }
  usersStore.set(id, newUser)
  console.log('[CocinaMóvil-Users] Usuario creado:', id, normalizedEmail)
  return stripPassword(newUser)
}

/**
 * Actualiza un usuario (sin tocar la contraseña).
 */
export function updateUser(
  id: string,
  updates: Partial<Omit<CmUserInput, 'password'>>
): CmUserRecord | null {
  const u = usersStore.get(id)
  if (!u) return null

  if (updates.email) {
    const normalized = updates.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Email inválido')
    }
    const existing = getUserByEmail(normalized)
    if (existing && existing.id !== id) {
      throw new Error('Ya existe otro usuario con ese email')
    }
    u.email = normalized
  }
  if (updates.firstName !== undefined) {
    if (!updates.firstName.trim()) throw new Error('El nombre es obligatorio')
    u.firstName = updates.firstName.trim()
  }
  if (updates.lastName !== undefined) {
    if (!updates.lastName.trim()) throw new Error('El apellido es obligatorio')
    u.lastName = updates.lastName.trim()
  }
  if (updates.dni !== undefined) {
    const newDni = updates.dni?.trim() || null
    if (newDni) {
      const dniExists = Array.from(usersStore.values()).find(
        (x) => x.dni === newDni && x.id !== id
      )
      if (dniExists) throw new Error('Ya existe otro usuario con ese DNI')
    }
    u.dni = newDni
  }
  if (updates.birthDate !== undefined) u.birthDate = updates.birthDate || null
  if (updates.gender !== undefined) u.gender = updates.gender || null
  if (updates.maritalStatus !== undefined) u.maritalStatus = updates.maritalStatus || null
  if (updates.avatar !== undefined) u.avatar = updates.avatar || null
  if (updates.address !== undefined) u.address = updates.address?.trim() || null
  if (updates.country !== undefined) u.country = updates.country?.trim() || null
  if (updates.province !== undefined) u.province = updates.province?.trim() || null
  if (updates.department !== undefined) u.department = updates.department?.trim() || null
  if (updates.municipality !== undefined) u.municipality = updates.municipality?.trim() || null
  if (updates.location !== undefined) u.location = updates.location || null
  if (updates.role !== undefined) u.role = updates.role

  u.updatedAt = Date.now()
  usersStore.set(id, u)
  console.log('[CocinaMóvil-Users] Usuario actualizado:', id)
  return stripPassword(u)
}

export function changeUserPassword(id: string, newPassword: string): boolean {
  const u = usersStore.get(id)
  if (!u) return false
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }
  u.password = newPassword
  u.updatedAt = Date.now()
  usersStore.set(id, u)
  console.log('[CocinaMóvil-Users] Contraseña cambiada para:', id)
  return true
}

export function setUserStatus(id: string, isActive: boolean): CmUserRecord | null {
  const u = usersStore.get(id)
  if (!u) return null
  u.isActive = isActive
  u.updatedAt = Date.now()
  usersStore.set(id, u)
  return stripPassword(u)
}

export function deleteUser(id: string): boolean {
  const u = usersStore.get(id)
  if (!u) return false
  if (u.role === 'admin' && u.isActive) {
    const activeAdmins = Array.from(usersStore.values()).filter(
      (x) => x.role === 'admin' && x.isActive && x.id !== id
    )
    if (activeAdmins.length === 0) {
      throw new Error('No se puede eliminar el último administrador activo')
    }
  }
  usersStore.delete(id)
  console.log('[CocinaMóvil-Users] Usuario eliminado:', id)
  return true
}

export function recordLogin(id: string): void {
  const u = usersStore.get(id)
  if (!u) return
  u.lastLoginAt = Date.now()
  u.updatedAt = Date.now()
  usersStore.set(id, u)
}

function stripPassword(u: CmUserWithPassword): CmUserRecord {
  const { password: _password, ...rest } = u
  return rest
}
