/**
 * ============================================================
 * API — Login de la Cocina Móvil
 * ============================================================
 * POST /api/cocina-movil/auth/login
 *
 * Body: { email: string, password: string }
 * Response 200: { token, user: { id, email, name, role, avatar } }
 * Response 401: { error: "Credenciales inválidas" }
 *
 * NOTA: Implementación DEMO con tokens stateless.
 * Ver src/lib/cocina-movil/auth.ts.
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { authenticateCm } from '@/lib/cocina-movil/auth'
import { checkRateLimit, getClientIp, LOGIN_RATE_LIMIT } from '@/lib/cocina-movil/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIp(request)
  const rateLimitKey = `login:${ip}`
  const rateLimit = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
      { status: 429 }
    )
  }

  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch (err) {
    console.error('[CocinaMóvil-Login] ❌ Body parse failed:', err)
    return NextResponse.json(
      { error: 'Cuerpo de la solicitud inválido. Se esperaba JSON.' },
      { status: 400 }
    )
  }

  const { email, password } = body

  // Validación de tipos
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Email y contraseña son obligatorios.' },
      { status: 400 }
    )
  }

  if (!email.trim() || !password.trim()) {
    return NextResponse.json(
      { error: 'Email y contraseña son obligatorios.' },
      { status: 400 }
    )
  }

  // Validación básica de formato de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json(
      { error: 'El formato del email no es válido.' },
      { status: 400 }
    )
  }

  const session = await authenticateCm(email, password)

  if (!session) {
    return NextResponse.json(
      { error: 'Credenciales inválidas. Verificá tu email y contraseña.' },
      { status: 401 }
    )
  }

  // Set HttpOnly cookie con el token (stateless — no requiere estado servidor)
  const isProd = process.env.NODE_ENV === 'production'
  const response = NextResponse.json({
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt,
  })

  response.cookies.set('cm_session', session.token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 horas
    ...(isProd ? { domain: '.laspastasdeorlando.com.ar' } : {}),
  })

  return response
}
