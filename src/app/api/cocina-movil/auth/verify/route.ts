/**
 * ============================================================
 * API — Verificar sesión de la Cocina Móvil
 * ============================================================
 * GET /api/cocina-movil/auth/verify
 *
 * Verifica si el token de sesión (cookie cm_session o header Authorization)
 * es válido. Stateless — no requiere estado servidor.
 *
 * Response 200: { valid: true, user: {...} }
 * Response 401: { valid: false }
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { validateCmSession } from '@/lib/cocina-movil/auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const cookieToken = request.cookies.get('cm_session')?.value
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.replace('Bearer ', '')

  const token = cookieToken || bearerToken

  console.log('[CocinaMóvil-Verify] GET /api/cocina-movil/auth/verify', {
    hasCookie: !!cookieToken,
    hasBearer: !!bearerToken,
    tokenPrefix: token ? token.slice(0, 20) + '...' : '(none)',
    host: request.headers.get('host'),
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
  })

  if (!token) {
    console.log('[CocinaMóvil-Verify] ❌ No token provided')
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  const session = validateCmSession(token)

  if (!session) {
    console.log('[CocinaMóvil-Verify] ❌ Session invalid or expired')
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  console.log('[CocinaMóvil-Verify] ✅ Session valid:', session.user.email)
  return NextResponse.json({
    valid: true,
    user: session.user,
    expiresAt: session.expiresAt,
  })
}
