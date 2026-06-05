import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbReady } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { notifyAdminPasswordReset } from '@/lib/whatsapp-admin'
import crypto from 'crypto'

// Rate limiting: Max 3 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>()

const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}

function isRateLimited(ip: string): boolean {
  const entry = rateLimitMap.get(ip)
  if (!entry) return false

  const now = Date.now()
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(ip)
    return false
  }
  return entry.count >= RATE_LIMIT_MAX
}

function incrementRateLimit(ip: string): void {
  const entry = rateLimitMap.get(ip)
  const now = Date.now()

  if (!entry || (now - entry.firstAttempt) > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now })
  } else {
    entry.count++
  }
}

// Periodically clean up stale rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip)
    }
  }
}, 10 * 60 * 1000)

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const GENERIC_RESPONSE = {
  message: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.',
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  console.log(`[forgot-password] Incoming request from IP: ${ip}`)

  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      console.warn(`[forgot-password] ⚠️ Rate limited IP: ${ip}`)
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
    }

    incrementRateLimit(ip)

    // Parse request body
    let email: string
    try {
      const body = await request.json()
      email = body.email
    } catch {
      console.warn('[forgot-password] ⚠️ Could not parse request body')
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
    }

    // Validate email format
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      console.warn(`[forgot-password] ⚠️ Invalid email format: "${email}"`)
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`[forgot-password] Processing recovery for: ${normalizedEmail}`)

    // Ensure database is ready
    await ensureDbReady()

    // Look up the user by email
    const usuario = await db.usuario.findUnique({
      where: { email: normalizedEmail },
    })

    const emailExists = !!usuario
    console.log(`[forgot-password] Email exists in DB: ${emailExists}`)

    if (emailExists) {
      // Generate a cryptographically secure random token
      const token = crypto.randomBytes(32).toString('hex')

      // Set expiration to 1 hour from now
      const fechaExpiracion = new Date(Date.now() + 60 * 60 * 1000)

      // Invalidate any previous unused tokens for this email
      await db.passwordReset.updateMany({
        where: {
          email: normalizedEmail,
          usado: false,
        },
        data: {
          usado: true,
        },
      })

      // Save the new token in PasswordReset table
      await db.passwordReset.create({
        data: {
          email: normalizedEmail,
          token,
          fecha_expiracion: fechaExpiracion,
          ip,
          usado: false,
        },
      })

      // Build the reset URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pastasorlando.vercel.app'
      const resetUrl = `${appUrl}/reset-password?token=${token}`
      console.log(`[forgot-password] Reset URL: ${resetUrl.substring(0, 60)}...`)

      // Send password reset email (awaited — we want to know if it fails)
      console.log('[forgot-password] 📧 Calling sendPasswordResetEmail...')
      await sendPasswordResetEmail(normalizedEmail, resetUrl)
      console.log('[forgot-password] 📧 sendPasswordResetEmail completed')

      // Send WhatsApp notification to admin (awaited so serverless doesn't kill it)
      console.log('[forgot-password] 📱 Calling notifyAdminPasswordReset...')
      await notifyAdminPasswordReset({
        email: normalizedEmail,
        emailExiste: true,
        ip,
      }).catch((err) => {
        console.error('[forgot-password] WhatsApp notification error (non-blocking):', err)
      })
      console.log('[forgot-password] 📱 notifyAdminPasswordReset completed')
    } else {
      // Email doesn't exist — still notify admin via WhatsApp
      console.log('[forgot-password] Email not found — sending admin notification only')
      await notifyAdminPasswordReset({
        email: normalizedEmail,
        emailExiste: false,
        ip,
      }).catch((err) => {
        console.error('[forgot-password] WhatsApp notification error (non-blocking):', err)
      })
    }

    // Log the attempt in LogAcceso table
    try {
      await db.logAcceso.create({
        data: {
          email: normalizedEmail,
          ip,
          resultado: 'PASSWORD_RESET_REQUEST',
        },
      })
    } catch (logErr) {
      console.error('[forgot-password] ⚠️ Failed to log access attempt:', logErr)
    }

    // Always respond with the same generic message
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
  } catch (error) {
    console.error('[forgot-password] ❌ Unhandled error:', error)

    // Still try to log the attempt even on error
    try {
      await ensureDbReady()
      await db.logAcceso.create({
        data: {
          ip,
          resultado: 'PASSWORD_RESET_REQUEST_ERROR',
        },
      })
    } catch (logErr) {
      console.error('[forgot-password] ⚠️ Failed to log error attempt:', logErr)
    }

    // Always return the same generic message
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
  }
}
