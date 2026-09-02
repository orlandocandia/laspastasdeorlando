/**
 * ============================================================
 * Cocina Móvil — Cliente de autenticación (frontend)
 * ============================================================
 * Funciones para usar desde componentes cliente:
 *  - login(email, password)
 *  - logout()
 *  - verifySession()
 *  - requestPasswordReset(email)
 *
 * Maneja el token via cookie HttpOnly (seteada por el servidor)
 * y opcionalmente en localStorage para acceso desde hooks.
 * ============================================================
 */

export interface CmUser {
  id: string
  email: string
  name: string
  role: 'cocinero' | 'supervisor' | 'admin'
  avatar: string
}

export interface CmLoginResult {
  ok: boolean
  user?: CmUser
  error?: string
}

const DEFAULT_AVATAR = '/images/(cocina-movil)/default-avatar.png'

/**
 * Inicia sesión en la Cocina Móvil.
 * En éxito, guarda el usuario en localStorage y retorna ok:true.
 * En error, retorna ok:false con mensaje genérico.
 */
export async function loginCm(
  email: string,
  password: string
): Promise<CmLoginResult> {
  try {
    const res = await fetch('/api/cocina-movil/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof data.error === 'string'
            ? data.error
            : 'Credenciales inválidas. Verificá tu email y contraseña.',
      }
    }

    // Guardar usuario en localStorage (para hooks de cliente)
    if (typeof window !== 'undefined' && data.user) {
      localStorage.setItem('cm_user', JSON.stringify(data.user))
    }

    return { ok: true, user: data.user }
  } catch {
    return {
      ok: false,
      error: 'No se pudo conectar con el servidor. Intentá de nuevo.',
    }
  }
}

/**
 * Cierra la sesión actual.
 */
export async function logoutCm(): Promise<void> {
  try {
    await fetch('/api/cocina-movil/auth/logout', { method: 'POST' })
  } catch {
    // ignorar errores de red
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cm_user')
    }
  }
}

/**
 * Verifica si hay una sesión activa consultando el endpoint /verify.
 */
export async function verifyCmSession(): Promise<{ valid: boolean; user?: CmUser }> {
  try {
    const res = await fetch('/api/cocina-movil/auth/verify', {
      cache: 'no-store',
    })
    if (!res.ok) return { valid: false }
    const data = await res.json()
    return { valid: !!data.valid, user: data.user }
  } catch {
    return { valid: false }
  }
}

/**
 * Solicita recuperación de contraseña.
 * Siempre devuelve ok:true (el backend no revela si el email existe).
 */
export async function requestCmPasswordReset(
  email: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/cocina-movil/auth/recover-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    return {
      ok: res.ok,
      message:
        typeof data.message === 'string'
          ? data.message
          : 'Si el email está registrado, te enviaremos las instrucciones.',
    }
  } catch {
    return {
      ok: false,
      message: 'No se pudo conectar con el servidor. Intentá de nuevo.',
    }
  }
}

/**
 * Obtiene el usuario actual desde localStorage (sin verificar token).
 * Retorna null si no hay usuario guardado.
 */
export function getCmUserFromStorage(): CmUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('cm_user')
    if (!raw) return null
    const user = JSON.parse(raw) as CmUser
    if (!user.avatar) user.avatar = DEFAULT_AVATAR
    return user
  } catch {
    return null
  }
}

export const CM_DEFAULT_AVATAR = DEFAULT_AVATAR
export const CM_LOGO = '/images/(cocina-movil)/logo.png'
export const CM_LOGIN_BG = '/images/(cocina-movil)/login-bg.jpg'
