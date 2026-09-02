/**
 * ============================================================
 * API — Logout de la Cocina Móvil
 * ============================================================
 * POST /api/cocina-movil/auth/logout
 *
 * Elimina la cookie cm_session y revoca el token.
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { revokeCmSession } from '@/lib/cocina-movil/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const token =
    request.cookies.get('cm_session')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  revokeCmSession(token)

  const response = NextResponse.json({ ok: true, message: 'Sesión cerrada.' })
  response.cookies.set('cm_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
