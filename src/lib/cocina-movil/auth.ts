/**
 * ============================================================
 * Cocina Móvil — Helpers de autenticación (demo)
 * ============================================================
 *
 * NOTA: Esta es una implementación DEMO simulada.
 * No realiza hash real ni conecta a la base de datos.
 * Cuando se integre con NextAuth / Prisma real, reemplazar
 * las funciones de este archivo por la lógica de producción.
 *
 * Usuarios demo hardcodeados para pruebas:
 *  - proyectos.orlando.candia@gmail.com / cocinero123  (rol: cocinero)
 *  - orlando.candia@gmail.com   / admin123    (rol: admin)
 * ============================================================
 */

export type CmRole = 'cocinero' | 'supervisor' | 'admin'

export interface CmUser {
  id: string
  email: string
  name: string
  role: CmRole
  avatar?: string | null
  isActive: boolean
}

export interface CmSession {
  token: string
  user: Omit<CmUser, 'avatar'> & { avatar: string }
  expiresAt: number // epoch ms
}

// ----- Usuarios demo (reemplazar por consulta a Prisma) -----
const DEMO_USERS: Record<string, { password: string; user: CmUser }> = {
  'proyectos.orlando.candia@gmail.com': {
    password: 'cocinero123',
    user: {
      id: 'cocinero-1',
      email: 'proyectos.orlando.candia@gmail.com',
      name: 'Cocinero',
      role: 'cocinero',
      avatar: null,
      isActive: true,
    },
  },
  'orlando.candia@gmail.com': {
    password: 'admin123',
    user: {
      id: 'admin-1',
      email: 'orlando.candia@gmail.com',
      name: 'Administrador',
      role: 'admin',
      avatar: null,
      isActive: true,
    },
  },
}

const DEFAULT_AVATAR = '/images/(cocina-movil)/default-avatar.png'
const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 horas

// ----- Sesiones en memoria (demo; en prod usar DB o Redis) -----
const sessions = new Map<string, CmSession>()

/**
 * Path de redirección según el rol del usuario.
 * Se usa cuando no hay ?next= explícito en la URL de login.
 *
 *  - admin      → /admin/dashboard
 *  - cocinero   → /cook/dashboard
 *  - supervisor → /supervisor/dashboard
 *  - fallback   → /dashboard
 */
export function getRedirectPathByRole(role: CmRole | undefined | null): string {
  switch (role) {
    case 'admin':
      return '/cm/admin/dashboard'
    case 'cocinero':
      return '/cm/cocina/dashboard'
    case 'supervisor':
      return '/cm/supervisor/dashboard'
    default:
      return '/cm/dashboard'
  }
}

/**
 * Intenta autenticar un usuario con email + contraseña.
 * Retorna null si las credenciales son inválidas o el usuario está inactivo.
 * POR SEGURIDAD: siempre tarda el mismo tiempo (delay artificial).
 */
export async function authenticateCm(
  email: string,
  password: string
): Promise<CmSession | null> {
  // Delay artificial constante para evitar timing attacks
  await new Promise((r) => setTimeout(r, 500))

  const normalizedEmail = email.trim().toLowerCase()
  const record = DEMO_USERS[normalizedEmail]

  // Mensaje genérico tanto si no existe el usuario como si la
  // contraseña es incorrecta o el usuario está inactivo.
  if (!record || record.password !== password) {
    return null
  }
  if (!record.user.isActive) {
    return null
  }

  const token = generateToken()
  const session: CmSession = {
    token,
    user: {
      ...record.user,
      avatar: record.user.avatar || DEFAULT_AVATAR,
    },
    expiresAt: Date.now() + SESSION_TTL_MS,
  }

  sessions.set(token, session)
  return session
}

/**
 * Valida un token de sesión. Retorna la sesión si es válida
 * y no ha expirado, o null en caso contrario.
 */
export function validateCmSession(token: string | undefined | null): CmSession | null {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return null
  }
  return session
}

/**
 * Cierra una sesión (logout).
 */
export function revokeCmSession(token: string | undefined | null): void {
  if (token) sessions.delete(token)
}

/**
 * Registra una solicitud de recuperación de contraseña.
 * En demo: siempre devuelve true (no revela si el email existe).
 * En prod: generar token, guardar en DB y enviar email con SMTP.
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  // Delay artificial constante
  await new Promise((r) => setTimeout(r, 600))
  const normalizedEmail = email.trim().toLowerCase()
  // En demo no hacemos nada con el email, pero registramos que se pidió.
  // En prod: generar token único, guardar en tabla PasswordReset con expiración,
  // enviar email con link /reset-password?token=xxx
  console.log(`[CocinaMóvil-Demo] Solicitud de recuperación para: ${normalizedEmail}`)
  return true
}

// ----- Helpers internos -----
function generateToken(): string {
  // Token demo simple. En prod usar crypto.randomUUID() o jsonwebtoken.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'cm_'
  for (let i = 0; i < 40; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}
