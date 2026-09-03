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

export const runtime = 'nodejs'

export async function POST(request: Request) {
  console.log('[CocinaMóvil-Login] ===== POST /api/cocina-movil/auth/login =====')
  console.log('[CocinaMóvil-Login] NODE_ENV:', process.env.NODE_ENV)
  console.log('[CocinaMóvil-Login] Request headers:', {
    'content-type': request.headers.get('content-type'),
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
  })

  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
    console.log('[CocinaMóvil-Login] Body parsed OK:', {
      hasEmail: !!body.email,
      hasPassword: !!body.password,
      emailType: typeof body.email,
      passwordType: typeof body.password,
    })
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
    console.log('[CocinaMóvil-Login] ❌ Invalid types: email is', typeof email, ', password is', typeof password)
    return NextResponse.json(
      { error: 'Email y contraseña son obligatorios.' },
      { status: 400 }
    )
  }

  if (!email.trim() || !password.trim()) {
    console.log('[CocinaMóvil-Login] ❌ Empty email or password')
    return NextResponse.json(
      { error: 'Email y contraseña son obligatorios.' },
      { status: 400 }
    )
  }

  // Validación básica de formato de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    console.log('[CocinaMóvil-Login] ❌ Invalid email format:', email)
    return NextResponse.json(
      { error: 'El formato del email no es válido.' },
      { status: 400 }
    )
  }

  console.log('[CocinaMóvil-Login] Calling authenticateCm...')
  const session = await authenticateCm(email, password)

  if (!session) {
    console.log('[CocinaMóvil-Login] ❌ authenticateCm returned null — returning 401')
    return NextResponse.json(
      { error: 'Credenciales inválidas. Verificá tu email y contraseña.' },
      { status: 401 }
    )
  }

  console.log('[CocinaMóvil-Login] ✅ Login success:', {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
    tokenPrefix: session.token.slice(0, 20) + '...',
  })

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

  console.log('[CocinaMóvil-Login] Cookie set:', {
    domain: isProd ? '.laspastasdeorlando.com.ar' : '(none — localhost)',
    secure: isProd,
    sameSite: 'lax',
  })

  return response
}
