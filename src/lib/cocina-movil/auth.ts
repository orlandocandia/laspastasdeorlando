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
 *  - cocina@laspastasdeorlando.com.ar / cocinero123
 *  - admin@laspastasdeorlando.com.ar / admin123
 * ============================================================
 */

export interface CmUser {
  id: string
  email: string
  name: string
  role: 'cocinero' | 'supervisor' | 'admin'
  avatar?: string | null
}

export interface CmSession {
  token: string
  user: Omit<CmUser, 'avatar'> & { avatar: string }
  expiresAt: number // epoch ms
}

// ----- Usuarios demo (reemplazar por consulta a Prisma) -----
const DEMO_USERS: Record<string, { password: string; user: CmUser }> = {
  'cocina@laspastasdeorlando.com.ar': {
    password: 'cocinero123',
    user: {
      id: 'cm-user-001',
      email: 'cocina@laspastasdeorlando.com.ar',
      name: 'Cocinero Demo',
      role: 'cocinero',
      avatar: null,
    },
  },
  'admin@laspastasdeorlando.com.ar': {
    password: 'admin123',
    user: {
      id: 'cm-user-002',
      email: 'admin@laspastasdeorlando.com.ar',
      name: 'Administrador Demo',
      role: 'admin',
      avatar: null,
    },
  },
}

const DEFAULT_AVATAR = '/images/(cocina-movil)/default-avatar.png'
const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 horas

// ----- Sesiones en memoria (demo; en prod usar DB o Redis) -----
const sessions = new Map<string, CmSession>()

/**
 * Intenta autenticar un usuario con email + contraseña.
 * Retorna null si las credenciales son inválidas.
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

  if (!record || record.password !== password) {
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
