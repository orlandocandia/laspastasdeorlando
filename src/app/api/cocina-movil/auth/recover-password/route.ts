/**
 * ============================================================
 * API — Recuperar contraseña de la Cocina Móvil
 * ============================================================
 * POST /api/cocina-movil/auth/recover-password
 *
 * Body: { email: string }
 * Response 200: { message: "Si el email está registrado, ..." }
 *
 * Genera un token de recuperación (stateless, 1 hora de validez)
 * y envía un email profesional con el enlace de reset.
 *
 * Por seguridad, SIEMPRE devuelve 200 con el mismo mensaje,
 * sin importar si el email existe o no.
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/cocina-movil/auth'
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
} from '@/lib/cocina-movil/email-templates'

// Dynamic import so that if smtp-transporter isn't available (e.g., local
// dev without nodemailer installed), the route still compiles and returns
// a graceful error instead of crashing the whole module.
let sendMail: ((opts: { to: string; from?: string; subject: string; html: string; text: string }) => Promise<unknown>) | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@/lib/smtp-transporter')
  if (mod && typeof mod.sendMail === 'function') {
    sendMail = mod.sendMail
  }
} catch {
  console.warn('[CocinaMóvil-Recover] smtp-transporter no disponible (¿nodemailer no instalado?)')
}

export const runtime = 'nodejs'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000'

export async function POST(request: Request) {
  console.log('[CocinaMóvil-Recover] POST /api/cocina-movil/auth/recover-password')

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

  // Mensaje genérico que SIEMPRE se devuelve (no revela si el email existe)
  const genericMessage =
    'Si el email está registrado en la Cocina Móvil, te enviamos las instrucciones para crear una nueva contraseña.'

  // Verificar SMTP configurado
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  if (!smtpConfigured) {
    console.error('[CocinaMóvil-Recover] ❌ SMTP no configurado (SMTP_USER/SMTP_PASS)')
    // En dev: devolver mensaje útil; en prod: mensaje genérico por seguridad
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          message: genericMessage,
          warning:
            'SMTP no configurado. Seteá SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM en .env.local',
        },
        { status: 200 }
      )
    }
    return NextResponse.json({ message: genericMessage }, { status: 200 })
  }

  // Generar token (stateless) y obtener usuario si existe
  const result = await requestPasswordReset(email)

  if (!result) {
    // Email no existe o usuario inactivo — NO enviar email
    // Pero devolver 200 con mensaje genérico (no filtrar)
    console.log('[CocinaMóvil-Recover] Email no encontrado o usuario inactivo (no se envía email)')
    return NextResponse.json({ message: genericMessage }, { status: 200 })
  }

  const { token, user } = result

  // Construir URL de reset.
  // Usamos /cm/reset-password?token=XXX para evitar conflicto con la ruta
  // /reset-password del sistema principal (src/app/(auth)/reset-password).
  const resetUrl = `${APP_URL.replace(/\/$/, '')}/cm/reset-password?token=${token}`

  // Generar email HTML + texto
  const html = buildPasswordResetEmailHtml({
    userName: user.name,
    resetUrl,
    expiresInHours: 1,
  })
  const text = buildPasswordResetEmailText({
    userName: user.name,
    resetUrl,
    expiresInHours: 1,
  })

  // Enviar email
  try {
    const from =
      process.env.SMTP_FROM ||
      `"Cocina Móvil — El Amigo de las Pastas" <${process.env.SMTP_USER}>`

    console.log('[CocinaMóvil-Recover] Enviando email a:', user.email)
    if (!sendMail) {
      throw new Error('Servidor de email no configurado (smtp-transporter no disponible)')
    }
    const info = await sendMail({
      to: user.email,
      from,
      subject: 'Restablecé tu contraseña — Cocina Móvil',
      html,
      text,
    })

    console.log('[CocinaMóvil-Recover] ✅ Email enviado:', {
      to: user.email,
      messageId: info.messageId,
      response: info.response,
    })
  } catch (err) {
    console.error('[CocinaMóvil-Recover] ❌ Error enviando email:', err)
    // En dev: mostrar error; en prod: mensaje genérico por seguridad
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          message: genericMessage,
          warning: `Error enviando email: ${err instanceof Error ? err.message : 'unknown'}`,
        },
        { status: 200 }
      )
    }
    return NextResponse.json({ message: genericMessage }, { status: 200 })
  }

  return NextResponse.json({ message: genericMessage }, { status: 200 })
}
