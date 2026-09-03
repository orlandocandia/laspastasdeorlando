/**
 * ============================================================
 * Cocina Móvil — Store de Usuarios (demo)
 * ============================================================
 *
 * Almacén de usuarios para el módulo de ABM de la Cocina Móvil.
 *
 * NOTA IMPORTANTE SOBRE VERCEL SERVERLESS:
 * Esta implementación usa un Map en memoria. En Vercel Serverless,
 * cada instancia de función tiene su propia memoria, por lo que los
 * cambios (crear/editar/eliminar usuarios) NO persistirán entre
 * requests de diferentes instancias.
 *
 * Para producción real, reemplazar las funciones de este archivo
 * por consultas a Prisma (tabla CmUsuario en la base de datos).
 * La interfaz pública (CmUserRecord, funciones CRUD) está diseñada
 * para que el swap a DB sea directo.
 * ============================================================
 */

import crypto from 'crypto'

export type CmRole = 'cocinero' | 'supervisor' | 'admin'

export interface CmUserRecord {
  id: string
  email: string
  name: string
  role: CmRole
  avatar: string | null
  isActive: boolean
  lastLoginAt: number | null
  createdAt: number
  updatedAt: number
}

export interface CmUserWithPassword extends CmUserRecord {
  password: string
}

// ----- Store en memoria (demo) -----
// En prod: reemplazar por `db.cmUsuario.findMany()` etc.
let usersStore: Map<string, CmUserWithPassword> = new Map()

// Inicializar con usuarios demo (seed)
function seedDemoUsers() {
  if (usersStore.size > 0) return
  const now = Date.now()
  const admin: CmUserWithPassword = {
    id: 'admin-1',
    email: 'orlando.candia@gmail.com',
    name: 'Administrador',
    role: 'admin',
    avatar: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    password: 'admin123',
  }
  const cocinero: CmUserWithPassword = {
    id: 'cocinero-1',
    email: 'proyectos.orlando.candia@gmail.com',
    name: 'Cocinero',
    role: 'cocinero',
    avatar: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    password: 'cocinero123',
  }
  usersStore.set(admin.id, admin)
  usersStore.set(cocinero.id, cocinero)
}

// Asegurar que el seed esté cargado
seedDemoUsers()

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

  // Filtro por búsqueda (nombre o email)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }

  // Filtro por rol
  if (role !== 'all') {
    users = users.filter((u) => u.role === role)
  }

  // Filtro por estado
  if (isActive !== 'all') {
    users = users.filter((u) => u.isActive === isActive)
  }

  // Ordenamiento
  users.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy === 'email') cmp = a.email.localeCompare(b.email)
    else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'lastLoginAt') {
      const aVal = a.lastLoginAt || 0
      const bVal = b.lastLoginAt || 0
      cmp = aVal - bVal
    }
    return sortOrder === 'desc' ? -cmp : cmp
  })

  const total = users.length
  const start = (page - 1) * pageSize
  const paged = users.slice(start, start + pageSize).map(stripPassword)

  return { users: paged, total, page, pageSize }
}

/**
 * Obtiene un usuario por ID (sin password).
 */
export function getUserById(id: string): CmUserRecord | null {
  const u = usersStore.get(id)
  return u ? stripPassword(u) : null
}

/**
 * Obtiene un usuario por email (sin password).
 */
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
 * Lanza Error si el email ya existe.
 */
export function createUser(input: {
  name: string
  email: string
  password: string
  role: CmRole
  avatar?: string | null
}): CmUserRecord {
  const normalizedEmail = input.email.trim().toLowerCase()
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Email inválido')
  }
  if (!input.name.trim()) throw new Error('El nombre es obligatorio')
  if (!input.password || input.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  // Verificar email único
  const existing = getUserByEmail(normalizedEmail)
  if (existing) {
    throw new Error('Ya existe un usuario con ese email')
  }

  const now = Date.now()
  const id = `cm-user-${crypto.randomBytes(6).toString('hex')}`
  const newUser: CmUserWithPassword = {
    id,
    email: normalizedEmail,
    name: input.name.trim(),
    role: input.role,
    avatar: input.avatar || null,
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
  updates: Partial<Pick<CmUserRecord, 'name' | 'email' | 'role' | 'avatar'>>
): CmUserRecord | null {
  const u = usersStore.get(id)
  if (!u) return null

  if (updates.email) {
    const normalized = updates.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Email inválido')
    }
    // Verificar email único (excluyendo el propio usuario)
    const existing = getUserByEmail(normalized)
    if (existing && existing.id !== id) {
      throw new Error('Ya existe otro usuario con ese email')
    }
    u.email = normalized
  }
  if (updates.name !== undefined) {
    if (!updates.name.trim()) throw new Error('El nombre es obligatorio')
    u.name = updates.name.trim()
  }
  if (updates.role !== undefined) {
    u.role = updates.role
  }
  if (updates.avatar !== undefined) {
    u.avatar = updates.avatar
  }
  u.updatedAt = Date.now()
  usersStore.set(id, u)
  console.log('[CocinaMóvil-Users] Usuario actualizado:', id)
  return stripPassword(u)
}

/**
 * Cambia la contraseña de un usuario.
 */
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

/**
 * Activa o desactiva un usuario.
 */
export function setUserStatus(id: string, isActive: boolean): CmUserRecord | null {
  const u = usersStore.get(id)
  if (!u) return null
  u.isActive = isActive
  u.updatedAt = Date.now()
  usersStore.set(id, u)
  console.log('[CocinaMóvil-Users] Usuario', id, isActive ? 'activado' : 'desactivado')
  return stripPassword(u)
}

/**
 * Elimina un usuario.
 * Lanza Error si se intenta eliminar el último admin.
 */
export function deleteUser(id: string): boolean {
  const u = usersStore.get(id)
  if (!u) return false
  // Proteger: no eliminar si es el último admin activo
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

/**
 * Registra el último login de un usuario (llamado tras login exitoso).
 */
export function recordLogin(id: string): void {
  const u = usersStore.get(id)
  if (!u) return
  u.lastLoginAt = Date.now()
  u.updatedAt = Date.now()
  usersStore.set(id, u)
}

// ----- Helper -----
function stripPassword(u: CmUserWithPassword): CmUserRecord {
  const { password: _password, ...rest } = u
  return rest
}
