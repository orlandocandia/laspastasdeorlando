// ---------------------------------------------------------------------------
// Shared SMTP Transporter — Pooled connection for Vercel serverless
// ---------------------------------------------------------------------------
//
// Creates a SINGLE nodemailer transporter with `pool: true` so that
// connections are reused within the lifetime of a serverless function.
// This eliminates the overhead of a fresh TLS handshake on every email.
//
// Usage:
//   import { getTransporter, sendMail } from '@/lib/smtp-transporter'
//   await sendMail({ to, subject, html, text })
//
// ---------------------------------------------------------------------------

import nodemailer from 'nodemailer'

let _transporter: nodemailer.Transporter | null = null

/**
 * Returns a cached nodemailer transporter with connection pooling enabled.
 *
 * Key optimizations for serverless:
 *   - `pool: true`       → reuses TCP connections instead of creating new ones
 *   - `maxConnections: 5`  → reasonable limit for Gmail SMTP
 *   - `maxMessages: Infinity` → no message limit per connection
 *   - `connectionTimeout` / `greetingTimeout` / `socketTimeout` → prevents hanging
 *
 * The transporter is lazily created on first call and cached in-memory.
 * In Vercel serverless, each function invocation gets its own process,
 * so the pool is reused only within a single invocation — but that's enough
 * when both recovery email + WhatsApp notification share the same call.
 */
export function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter

  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  const smtpSecure = process.env.SMTP_SECURE === 'true'

  if (!smtpUser || !smtpPass) {
    console.error('[SMTP] ❌ SMTP_USER o SMTP_PASS no configurados — no se puede crear transporter')
    throw new Error('SMTP credentials not configured')
  }

  console.log(`[SMTP] Creando transporter pooled → ${smtpHost}:${smtpPort} (secure=${smtpSecure})`)

  _transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // ── Pool de conexiones (KEY para serverless) ──────────────────────
    pool: true,
    maxConnections: 5,
    maxMessages: Infinity,

    // ── Timeouts para evitar colgadas ─────────────────────────────────
    connectionTimeout: 10_000,  // 10s para conectar
    greetingTimeout: 10_000,    // 10s para greeting del server
    socketTimeout: 30_000,      // 30s para operaciones de socket

    // ── TLS ───────────────────────────────────────────────────────────
    tls: {
      rejectUnauthorized: false,  // más tolerante en serverless
    },
  })

  return _transporter
}

/**
 * Convenience wrapper: sends an email using the shared pooled transporter.
 *
 * Returns the nodemailer `SentMessageInfo` on success.
 * Throws on failure — the caller is responsible for catching.
 */
export async function sendMail(options: nodemailer.SendMailOptions): Promise<nodemailer.SentMessageInfo> {
  const transporter = getTransporter()

  const from = options.from || process.env.SMTP_FROM || `"Pastas Orlando" <${process.env.SMTP_USER}>`

  const result = await transporter.sendMail({
    ...options,
    from,
  })

  return result
}

/**
 * Closes the pooled transporter and clears the cache.
 * Useful for cleanup in long-running processes (not needed in serverless).
 */
export function closeTransporter(): void {
  if (_transporter) {
    _transporter.close()
    _transporter = null
  }
}
