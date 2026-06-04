import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'
import bcrypt from 'bcryptjs'

// In-memory rate limiter: max 5 attempts per hour per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > MAX_ATTEMPTS) {
    return true
  }

  return false
}

// Password validation: min 8 chars, at least 1 number, at least 1 uppercase
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }
  if (!/\d/.test(password)) {
    return 'La contraseña debe contener al menos un número'
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula'
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady()

    // Get client IP from x-forwarded-for header
    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

    // Rate limiting check
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intentá de nuevo en una hora.' },
        { status: 429 }
      )
    }

    // Parse request body
    let body: { token?: string; newPassword?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido' },
        { status: 400 }
      )
    }

    const { token, newPassword } = body

    // Validate required fields
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      )
    }

    // Look up the token in the PasswordReset table
    const resetRecord = await db.passwordReset.findUnique({
      where: { token },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (resetRecord.usado) {
      return NextResponse.json(
        { error: 'Este link ya fue utilizado. Solicitá uno nuevo.' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > resetRecord.fecha_expiracion) {
      return NextResponse.json(
        { error: 'El link expiró. Solicitá uno nuevo.' },
        { status: 400 }
      )
    }

    // Token is valid — find the user by email
    const usuario = await db.usuario.findUnique({
      where: { email: resetRecord.email },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user's password
    await db.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword },
    })

    // Mark the token as used
    await db.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usado: true },
    })

    // Invalidate ALL other password reset tokens for this email
    await db.passwordReset.updateMany({
      where: {
        email: resetRecord.email,
        usado: false,
        id: { not: resetRecord.id },
      },
      data: { usado: true },
    })

    // Log the action in LogAcceso
    await db.logAcceso.create({
      data: {
        id_usuario: usuario.id,
        email_intento: resetRecord.email,
        resultado: 'PASSWORD_RESET_OK',
        ip: clientIp,
      },
    })

    return NextResponse.json(
      { message: 'Contraseña actualizada correctamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
