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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  console.log(`[RECOVERY] Incoming request from IP: ${ip}`)

  // Diagnostic info — will be included in the response
  const diag = {
    emailSent: false,
    emailError: null as string | null,
    whatsappSent: false,
    whatsappReason: null as string | null,
    envCheck: {
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_HOST: process.env.SMTP_HOST || '(not set)',
      SMTP_FROM: process.env.SMTP_FROM || '(not set)',
      ADMIN_WHATSAPP: process.env.ADMIN_WHATSAPP || '(not set)',
      TEXTMEBOT_APIKEY: !!process.env.TEXTMEBOT_APIKEY,
    },
  }

  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      console.warn(`[RECOVERY] ⚠️ Rate limited IP: ${ip}`)
      return NextResponse.json({
        message: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.',
        diag,
      }, { status: 200 })
    }

    incrementRateLimit(ip)

    // Parse request body
    let email: string
    try {
      const body = await request.json()
      email = body.email
    } catch {
      console.warn('[RECOVERY] ⚠️ Could not parse request body')
      return NextResponse.json({
        message: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.',
        diag,
      }, { status: 200 })
    }

    // Validate email format
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      console.warn(`[RECOVERY] ⚠️ Invalid email format: "${email}"`)
      return NextResponse.json({
        message: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.',
        diag,
      }, { status: 200 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`[RECOVERY] Processing recovery for: ${normalizedEmail}`)

    // Ensure database is ready
    await ensureDbReady()

    // Look up the user by email
    const usuario = await db.usuario.findUnique({
      where: { email: normalizedEmail },
    })

    const emailExists = !!usuario
    console.log(`[RECOVERY] Email exists in DB: ${emailExists}`)

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
      console.log(`[RECOVERY] Reset URL: ${resetUrl.substring(0, 60)}...`)

      // Send password reset email
      console.log('[RECOVERY] 📧 Calling sendPasswordResetEmail...')
      try {
        await sendPasswordResetEmail(normalizedEmail, resetUrl)
        diag.emailSent = true
        console.log('[RECOVERY] 📧 Email enviado con éxito')
      } catch (emailErr) {
        diag.emailError = emailErr instanceof Error ? emailErr.message : String(emailErr)
        console.error('[RECOVERY] 📧 Error enviando email:', emailErr)
      }

      // Send WhatsApp notification to admin
      console.log('[RECOVERY] 📱 Iniciando envío de WhatsApp...')
      try {
        const waResult = await notifyAdminPasswordReset({
          email: normalizedEmail,
          emailExiste: true,
          ip,
        })
        diag.whatsappSent = waResult.sent
        diag.whatsappReason = waResult.reason || null
        if (waResult.sent) {
          console.log('[RECOVERY] 📱 WhatsApp enviado con éxito')
        } else {
          console.error(`[RECOVERY] 📱 Error en WhatsApp: ${waResult.reason}`)
        }
      } catch (waErr) {
        diag.whatsappSent = false
        diag.whatsappReason = waErr instanceof Error ? waErr.message : String(waErr)
        console.error('[RECOVERY] 📱 Error en WhatsApp (excepción):', waErr)
      }
    } else {
      // Email doesn't exist — still notify admin via WhatsApp
      console.log('[RECOVERY] Email not found — sending admin notification only')
      try {
        const waResult = await notifyAdminPasswordReset({
          email: normalizedEmail,
          emailExiste: false,
          ip,
        })
        diag.whatsappSent = waResult.sent
        diag.whatsappReason = waResult.reason || null
        if (waResult.sent) {
          console.log('[RECOVERY] 📱 WhatsApp enviado con éxito (email no existe)')
        } else {
          console.error(`[RECOVERY] 📱 Error en WhatsApp: ${waResult.reason}`)
        }
      } catch (waErr) {
        diag.whatsappSent = false
        diag.whatsappReason = waErr instanceof Error ? waErr.message : String(waErr)
        console.error('[RECOVERY] 📱 Error en WhatsApp (excepción):', waErr)
      }
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
      console.error('[RECOVERY] ⚠️ Failed to log access attempt:', logErr)
    }

    // Return response with diagnostic info
    return NextResponse.json({
      message: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.',
      diag,
    }, { status: 200 })
  } catch (error) {
    console.error('[RECOVERY] ❌ Unhandled error:', error)

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
      console.error('[RECOVERY] ⚠️ Failed to log error attempt:', logErr)
    }

    diag.whatsappReason = error instanceof Error ? error.message : String(error)

    return NextResponse.json({
      message: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.',
      diag,
    }, { status: 200 })
  }
}
