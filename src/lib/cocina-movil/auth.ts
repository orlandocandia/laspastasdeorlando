/**
 * ============================================================
 * Cocina Móvil — Helpers de autenticación (demo)
 * ============================================================
 *
 * Implementación DEMO con tokens STATELESS (sin estado servidor).
 *
 * NOTA IMPORTANTE SOBRE VERCEL/SERVERLESS:
 * La versión anterior usaba un Map<string, CmSession> en memoria
 * para guardar las sesiones. En Vercel Serverless, cada request
 * puede ejecutarse en una instancia de función DIFERENTE, por lo
 * que la sesión guardada en la instancia A no está disponible en
 * la instancia B. Esto causaba que /verify siempre devolviera
 * 401 (sesión no encontrada) en producción.
 *
 * Solución: tokens stateless firmados con HMAC-SHA256.
 * El token contiene el usuario + expiración codificados en base64,
 * más una firma HMAC. No requiere estado servidor.
 *
 * Usuarios demo hardcodeados para pruebas:
 *  - proyectos.orlando.candia@gmail.com / cocinero123  (rol: cocinero)
 *  - orlando.candia@gmail.com   / admin123    (rol: admin)
 * ============================================================
 */

import crypto from 'crypto'

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

// ----- Secret para firmar tokens (stateless) -----
// En producción usar una variable de entorno.
// Fallback a un valor por defecto para dev (NO usar en prod real).
const CM_AUTH_SECRET =
  process.env.CM_AUTH_SECRET ||
  'cocina-movil-demo-secret-change-in-production-2026'

/**
 * Path de redirección según el rol del usuario.
 * Se usa cuando no hay ?next= explícito en la URL de login.
 *
 *  - admin      → /cm/admin/dashboard
 *  - cocinero   → /cm/cocina/dashboard
 *  - supervisor → /cm/supervisor/dashboard
 *  - fallback   → /cm/dashboard
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
 * Crea un token stateless firmado con HMAC-SHA256.
 * Formato: base64(payload).base64(signature)
 * El payload contiene { user, expiresAt }.
 */
function createToken(session: Omit<CmSession, 'token'>): string {
  const payload = JSON.stringify({
    user: session.user,
    expiresAt: session.expiresAt,
  })
  const payloadB64 = Buffer.from(payload, 'utf-8').toString('base64url')
  const signature = crypto
    .createHmac('sha256', CM_AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url')
  return `cm_${payloadB64}.${signature}`
}

/**
 * Verifica un token stateless y retorna la sesión si es válido.
 * No requiere estado servidor (ideal para Vercel serverless).
 */
function verifyToken(token: string): CmSession | null {
  try {
    if (!token.startsWith('cm_')) return null
    const stripped = token.slice(3) // quitar prefijo "cm_"
    const [payloadB64, signature] = stripped.split('.')
    if (!payloadB64 || !signature) return null

    // Verificar firma
    const expectedSignature = crypto
      .createHmac('sha256', CM_AUTH_SECRET)
      .update(payloadB64)
      .digest('base64url')

    // Comparación timing-safe
    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)
    if (sigBuffer.length !== expectedBuffer.length) return null
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null

    // Decodificar payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    ) as { user: CmSession['user']; expiresAt: number }

    // Verificar expiración
    if (Date.now() > payload.expiresAt) return null

    return {
      token,
      user: payload.user,
      expiresAt: payload.expiresAt,
    }
  } catch {
    return null
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

  // Normalización robusta: trim + lowercase
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()

  const record = DEMO_USERS[normalizedEmail]

  // Debug logging (temporal — quitar en producción real)
  console.log('[CocinaMóvil-Auth] Login attempt:', {
    emailOriginal: email,
    emailNormalized: normalizedEmail,
    userFound: !!record,
    passwordLength: normalizedPassword.length,
    expectedPasswordLength: record?.password?.length,
    passwordMatch: record ? record.password === normalizedPassword : false,
    isActive: record?.user?.isActive,
  })

  // Mensaje genérico tanto si no existe el usuario como si la
  // contraseña es incorrecta o el usuario está inactivo.
  if (!record || record.password !== normalizedPassword) {
    console.log('[CocinaMóvil-Auth] ❌ Authentication failed: invalid credentials')
    return null
  }
  if (!record.user.isActive) {
    console.log('[CocinaMóvil-Auth] ❌ Authentication failed: user inactive')
    return null
  }

  console.log('[CocinaMóvil-Auth] ✅ Authentication success:', record.user.email)

  const expiresAt = Date.now() + SESSION_TTL_MS
  const session: CmSession = {
    token: '', // se setea abajo
    user: {
      ...record.user,
      avatar: record.user.avatar || DEFAULT_AVATAR,
    },
    expiresAt,
  }

  session.token = createToken(session)
  return session
}

/**
 * Valida un token de sesión (stateless — sin estado servidor).
 * Retorna la sesión si el token es válido y no ha expirado.
 */
export function validateCmSession(token: string | undefined | null): CmSession | null {
  if (!token) return null
  const session = verifyToken(token)
  if (!session) {
    console.log('[CocinaMóvil-Auth] Session validation failed: invalid or expired token')
  }
  return session
}

/**
 * Cierra una sesión (stateless — el token simplemente deja de ser válido
 * cuando expira o cuando el cliente lo descarta).
 * En una implementación con DB, aquí se marcaría el token como revocado.
 */
export function revokeCmSession(token: string | undefined | null): void {
  // Stateless: no hay nada que revocar en el servidor.
  // El cliente debe borrar la cookie.
  if (token) {
    console.log('[CocinaMóvil-Auth] Logout (client-side cookie clear):', token.slice(0, 20) + '...')
  }
}

// Reset tokens guardados en memoria (en prod usar DB/Redis).
// NOTA: En Vercel serverless, cada instancia tiene su propio Map.
// Para que el reset funcione entre instancias, el token es STATELESS
// (firmado con HMAC) y su validez se verifica con la firma + expiración.
// El Map se usa solo como blacklist de tokens YA USADOS (single-use).
const usedResetTokens = new Set<string>()

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60 // 1 hora

/**
 * Crea un token de recuperación de contraseña (stateless, firmado).
 * El token contiene el email + expiración, firmados con HMAC-SHA256.
 * No requiere estado servidor para validar (excepto la blacklist de single-use).
 */
export function createPasswordResetToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  const payload = JSON.stringify({
    email: normalizedEmail,
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    nonce: crypto.randomBytes(16).toString('hex'), // uniqueness
  })
  const payloadB64 = Buffer.from(payload, 'utf-8').toString('base64url')
  const signature = crypto
    .createHmac('sha256', CM_AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url')
  return `cmreset_${payloadB64}.${signature}`
}

/**
 * Verifica un token de recuperación de contraseña.
 * Retorna el email si el token es válido y no ha expirado, o null si:
 *  - la firma no coincide
 *  - expiró
 *  - ya fue usado (está en la blacklist single-use)
 */
export function verifyPasswordResetToken(token: string): string | null {
  try {
    if (!token.startsWith('cmreset_')) return null
    const stripped = token.slice('cmreset_'.length)
    const [payloadB64, signature] = stripped.split('.')
    if (!payloadB64 || !signature) return null

    // Verificar firma
    const expectedSignature = crypto
      .createHmac('sha256', CM_AUTH_SECRET)
      .update(payloadB64)
      .digest('base64url')

    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)
    if (sigBuffer.length !== expectedBuffer.length) return null
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null

    // Decodificar payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    ) as { email: string; expiresAt: number; nonce: string }

    // Verificar expiración
    if (Date.now() > payload.expiresAt) {
      console.log('[CocinaMóvil-Auth] Reset token expired')
      return null
    }

    // Verificar single-use (no reutilizable)
    if (usedResetTokens.has(token)) {
      console.log('[CocinaMóvil-Auth] Reset token already used (single-use)')
      return null
    }

    return payload.email
  } catch {
    return null
  }
}

/**
 * Marca un token como usado (single-use). Debe llamarse después de
 * cambiar la contraseña exitosamente.
 */
export function consumePasswordResetToken(token: string): void {
  usedResetTokens.add(token)
  console.log('[CocinaMóvil-Auth] Reset token consumed (single-use)')
}

/**
 * Busca un usuario por email. Retorna el usuario (sin password) o null.
 * Case-insensitive, trim.
 */
export function findUserByEmail(email: string): CmUser | null {
  const normalizedEmail = email.trim().toLowerCase()
  const record = DEMO_USERS[normalizedEmail]
  return record?.user ?? null
}

/**
 * Actualiza la contraseña de un usuario.
 * En demo: actualiza el Map en memoria (NO persiste entre instancias en Vercel).
 * En prod: aquí se actualizaría la DB (hash bcrypt).
 * Retorna true si se actualizó, false si el usuario no existe o está inactivo.
 */
export function updateUserPassword(email: string, newPassword: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  const record = DEMO_USERS[normalizedEmail]
  if (!record || !record.user.isActive) {
    console.log('[CocinaMóvil-Auth] Cannot update password: user not found or inactive')
    return false
  }
  // DEMO: actualiza en memoria (en prod: hash bcrypt + DB)
  record.password = newPassword.trim()
  console.log('[CocinaMóvil-Auth] Password updated for:', normalizedEmail)
  return true
}

/**
 * Registra una solicitud de recuperación de contraseña.
 * Genera un token stateless y retorna el email del usuario si existe
 * (para que el caller pueda enviar el email).
 * No revela si el email existe o no (el caller debe comportarse igual).
 */
export async function requestPasswordReset(email: string): Promise<{ token: string; user: CmUser } | null> {
  await new Promise((r) => setTimeout(r, 600))
  const normalizedEmail = email.trim().toLowerCase()
  const record = DEMO_USERS[normalizedEmail]

  if (!record || !record.user.isActive) {
    console.log(`[CocinaMóvil-Auth] Password reset requested for unknown/inactive: ${normalizedEmail}`)
    return null
  }

  const token = createPasswordResetToken(normalizedEmail)
  console.log(`[CocinaMóvil-Auth] Password reset token created for: ${normalizedEmail}`)
  return { token, user: record.user }
}

/**
 * Retorna la lista de usuarios demo configurados (sin contraseñas).
 * Útil para depurar y verificar que el código desplegado tiene los
 * usuarios correctos.
 */
export function getDemoUsersDebug(): Array<{ id: string; email: string; name: string; role: CmRole; isActive: boolean }> {
  return Object.values(DEMO_USERS).map((r) => ({
    id: r.user.id,
    email: r.user.email,
    name: r.user.name,
    role: r.user.role,
    isActive: r.user.isActive,
  }))
}
