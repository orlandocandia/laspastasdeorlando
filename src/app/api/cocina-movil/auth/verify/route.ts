/**
 * ============================================================
 * API — Verificar sesión de la Cocina Móvil
 * ============================================================
 * GET /api/cocina-movil/auth/verify
 *
 * Verifica si el token de sesión (cookie cm_session) es válido.
 * Response 200: { valid: true, user: {...} }
 * Response 401: { valid: false }
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { validateCmSession } from '@/lib/cocina-movil/auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const token =
    request.cookies.get('cm_session')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  const session = validateCmSession(token)

  if (!session) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  return NextResponse.json({
    valid: true,
    user: session.user,
    expiresAt: session.expiresAt,
  })
}
