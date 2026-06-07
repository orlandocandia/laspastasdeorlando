import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/diagnostico-whatsapp
//
// Diagnóstico de configuración WhatsApp en producción (Vercel).
// Permite verificar si las variables de entorno están correctamente inyectadas.
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs'

export async function GET() {
  const apiKey = process.env.TEXTMEBOT_APIKEY
  const adminWhatsapp = process.env.ADMIN_WHATSAPP

  // Test connectivity to TextMeBot API
  let hasFetchError = false
  let fetchStatus: number | null = null
  let fetchBody: string | null = null

  try {
    const res = await fetch('https://api.textmebot.com/send.php', {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    })
    fetchStatus = res.status
    fetchBody = await res.text()
  } catch (err) {
    hasFetchError = true
    fetchBody = err instanceof Error ? err.message : String(err)
  }

  const result = {
    // ── WhatsApp config ───────────────────────────────────────────────
    whatsappKeyExists: typeof apiKey === 'string' && apiKey.length > 0,
    whatsappKeyStartsWith: apiKey ? apiKey.substring(0, 4) : '(not set)',
    adminWhatsapp: adminWhatsapp || '(not set)',
    adminWhatsappLength: adminWhatsapp ? adminWhatsapp.length : 0,

    // ── Environment ───────────────────────────────────────────────────
    nodeEnv: process.env.NODE_ENV || '(not set)',
    allEnvKeys: Object.keys(process.env).sort(),

    // ── Connectivity test ─────────────────────────────────────────────
    hasFetchError,
    fetchStatus,
    fetchBodyPreview: fetchBody ? fetchBody.substring(0, 200) : null,

    // ── Timestamp ─────────────────────────────────────────────────────
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(result, { status: 200 })
}
