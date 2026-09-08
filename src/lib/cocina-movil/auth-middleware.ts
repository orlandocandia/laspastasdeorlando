/**
 * ============================================================
 * Cocina Móvil — Auth Middleware Helper
 * ============================================================
 * Provides `requireAuth()` for API routes to validate the
 * session token (from cookie or Bearer header) before
 * processing any request.
 *
 * Usage in route.ts:
 *   import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
 *
 *   export async function GET(request: Request) {
 *     const auth = requireAuth(request)
 *     if (!auth.authorized) return auth.response!
 *     // ... your handler code ...
 *   }
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { validateCmSession } from '@/lib/cocina-movil/auth'

interface AuthResult {
  authorized: boolean
  response?: NextResponse
  session?: NonNullable<ReturnType<typeof validateCmSession>>
}

/**
 * Validates the session token from the request.
 * Returns { authorized: true, session } if valid,
 * or { authorized: false, response: 401 } if invalid.
 *
 * Use in API routes:
 *   const auth = requireAuth(request)
 *   if (!auth.authorized) return auth.response!
 */
export function requireAuth(request: Request): AuthResult {
  // Try cookie first, then Bearer token
  const cookieToken = request.cookies.get('cm_session')?.value
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.replace('Bearer ', '')
  const token = cookieToken || bearerToken

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'No autenticado. Token de sesión requerido.' },
        { status: 401 }
      ),
    }
  }

  const session = validateCmSession(token)

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Sesión inválida o expirada.' },
        { status: 401 }
      ),
    }
  }

  return { authorized: true, session }
}
