/**
 * ============================================================
 * API — Restablecer contraseña de la Cocina Móvil
 * ============================================================
 * POST /api/cocina-movil/auth/reset-password
 *
 * Body: { token: string, newPassword: string }
 * Response 200: { ok: true, message: "Contraseña actualizada" }
 * Response 400: { error: "Token y contraseña son obligatorios" }
 * Response 401: { error: "Token inválido o expirado" }
 *
 * Verifica el token (stateless, single-use, 1h TTL),
 * actualiza la contraseña, y marca el token como usado.
 * ============================================================
 */
import { NextResponse } from 'next/server'
import {
  verifyPasswordResetToken,
  consumePasswordResetToken,
  updateUserPassword,
} from '@/lib/cocina-movil/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  console.log('[CocinaMóvil-Reset] POST /api/cocina-movil/auth/reset-password')

  let body: { token?: unknown; newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de la solicitud inválido. Se esperaba JSON.' },
      { status: 400 }
    )
  }

  const { token, newPassword } = body

  if (typeof token !== 'string' || typeof newPassword !== 'string') {
    return NextResponse.json(
      { error: 'Token y nueva contraseña son obligatorios.' },
      { status: 400 }
    )
  }

  if (!token.trim() || !newPassword.trim()) {
    return NextResponse.json(
      { error: 'Token y nueva contraseña son obligatorios.' },
      { status: 400 }
    )
  }

  // Validar longitud mínima de contraseña
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'La contraseña debe tener al menos 6 caracteres.' },
      { status: 400 }
    )
  }

  // Verificar token (stateless — verifica firma HMAC + expiración + single-use)
  const email = verifyPasswordResetToken(token)

  if (!email) {
    console.log('[CocinaMóvil-Reset] ❌ Token inválido, expirado o ya usado')
    return NextResponse.json(
      {
        error:
          'El enlace de recuperación es inválido, ha expirado o ya fue utilizado. Solicitá uno nuevo.',
      },
      { status: 401 }
    )
  }

  console.log('[CocinaMóvil-Reset] Token válido para:', email)

  // Actualizar contraseña
  const updated = updateUserPassword(email, newPassword)

  if (!updated) {
    console.log('[CocinaMóvil-Reset] ❌ No se pudo actualizar la contraseña')
    return NextResponse.json(
      { error: 'No se pudo actualizar la contraseña. Intentá de nuevo.' },
      { status: 500 }
    )
  }

  // Marcar token como usado (single-use)
  consumePasswordResetToken(token)

  console.log('[CocinaMóvil-Reset] ✅ Contraseña actualizada para:', email)

  return NextResponse.json({
    ok: true,
    message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.',
  })
}
