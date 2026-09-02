/**
 * ============================================================
 * API — Recuperar contraseña de la Cocina Móvil
 * ============================================================
 * POST /api/cocina-movil/auth/recover-password
 *
 * Body: { email: string }
 * Response 200: { message: "Si el email está registrado, ..." }
 *
 * Por seguridad, SIEMPRE devuelve 200 con el mismo mensaje,
 * sin importar si el email existe o no.
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/cocina-movil/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de la solicitud inválido. Se esperaba JSON.' },
      { status: 400 }
    )
  }

  const { email } = body

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json(
      { error: 'El email es obligatorio.' },
      { status: 400 }
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json(
      { error: 'El formato del email no es válido.' },
      { status: 400 }
    )
  }

  // Registra la solicitud (en demo: solo log; en prod: enviar email)
  await requestPasswordReset(email)

  // Mensaje genérico idéntico siempre (no filtrar si el email existe)
  return NextResponse.json({
    message:
      'Si el email está registrado en la Cocina Móvil, te enviamos las instrucciones para crear una nueva contraseña.',
  })
}
