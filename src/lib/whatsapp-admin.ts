// ---------------------------------------------------------------------------
// WhatsApp Admin Notification — TextMeBot API
// ---------------------------------------------------------------------------
//
// Sends WhatsApp messages to the admin via TextMeBot.
// This MUST be awaited by the caller so the serverless function
// doesn't terminate before the fetch completes.
//
// API docs: https://api.textmebot.com/send.php
// Parameters: recipient (without +), apikey, text
// ---------------------------------------------------------------------------

export type WhatsAppResult = {
  sent: boolean;
  reason?: string;
  statusCode?: number;
  responseBody?: string;
};

/**
 * Low-level function to send a WhatsApp message via TextMeBot.
 *
 * ⚠️  The caller SHOULD await this function. In Vercel serverless, an
 * un-awaited fire-and-forget fetch will be killed when the function
 * terminates. We still catch errors internally so the calling flow
 * is never broken.
 */
export async function sendWhatsAppMessage(message: string): Promise<WhatsAppResult> {
  const adminPhone = process.env.ADMIN_WHATSAPP || '543754419324';
  const apiKey = process.env.TEXTMEBOT_APIKEY;

  console.log('[WhatsApp] ADMIN_WHATSAPP existe?', !!process.env.ADMIN_WHATSAPP);
  console.log('[WhatsApp] TEXTMEBOT_APIKEY existe?', !!process.env.TEXTMEBOT_APIKEY);
  console.log(`[WhatsApp] ADMIN_WHATSAPP value: "${adminPhone}"`);
  console.log(`[WhatsApp] TEXTMEBOT_APIKEY: "${apiKey ? apiKey.substring(0, 4) + '***' : '(not set)'}"`);

  // If no API key is configured, skip with clear log
  if (!apiKey) {
    const reason = 'TEXTMEBOT_APIKEY no configurado en variables de entorno';
    console.error(`[WhatsApp] ❌ ${reason} — NO se enviará notificación`);
    return { sent: false, reason };
  }

  const url =
    `https://api.textmebot.com/send.php` +
    `?recipient=${encodeURIComponent(adminPhone)}` +
    `&apikey=${encodeURIComponent(apiKey)}` +
    `&text=${encodeURIComponent(message)}`;

  // Log the URL with masked apikey for debugging
  const maskedUrl = url.replace(/apikey=[^&]+/, 'apikey=***');
  console.log(`[WhatsApp] Enviando a TextMeBot: ${maskedUrl}`);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });

    const body = await res.text();
    console.log(`[WhatsApp] TextMeBot response status: ${res.status} | body: ${body}`);

    if (res.ok || body.toLowerCase().includes('success')) {
      console.log('[WhatsApp] ✅ Mensaje enviado con éxito');
      return { sent: true, statusCode: res.status, responseBody: body };
    } else {
      const reason = `TextMeBot respondió con status ${res.status}: ${body}`;
      console.error(`[WhatsApp] ❌ ${reason}`);
      return { sent: false, reason, statusCode: res.status, responseBody: body };
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error('[WhatsApp] ❌ Error de conexión con TextMeBot:', reason);
    return { sent: false, reason };
  }
}

// ---------------------------------------------------------------------------
// Password Reset Notification
// ---------------------------------------------------------------------------

interface PasswordResetNotificationData {
  email: string;
  ip: string;
  emailExiste: boolean;
  fecha?: string;
}

/**
 * Notifies the admin via WhatsApp that a password-reset was requested.
 */
export async function notifyAdminPasswordReset(
  data: PasswordResetNotificationData,
): Promise<WhatsAppResult> {
  console.log('[RECOVERY] Iniciando envío de WhatsApp para recuperación de contraseña');

  const fecha = data.fecha || new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

  // Build a concise, readable message
  const message = [
    '🔐 *Solicitud de restablecimiento de contraseña*',
    `📅 Fecha: ${fecha}`,
    `📧 Email: ${data.email}`,
    `🌐 IP: ${data.ip}`,
    `${data.emailExiste ? '✅ Email registrado en BD' : '❌ Email NO registrado en BD'}`,
    '— Pastas Orlando',
  ].join('\n');

  const result = await sendWhatsAppMessage(message);

  if (result.sent) {
    console.log('[RECOVERY] WhatsApp enviado con éxito');
  } else {
    console.error(`[RECOVERY] Error en WhatsApp: ${result.reason || 'desconocido'}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Consulta (Contact Form) Notification
// ---------------------------------------------------------------------------

interface ConsultaNotificationData {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
}

/**
 * Notifies the admin via WhatsApp that a new consulta was received.
 */
export async function notifyAdminConsulta(
  data: ConsultaNotificationData,
): Promise<WhatsAppResult> {
  console.log('[CONSULTA] Iniciando envío de WhatsApp para nueva consulta');

  const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

  const message = [
    '📋 *NUEVA CONSULTA - Pastas Orlando*',
    `📅 Fecha: ${fecha}`,
    `👤 Nombre: ${data.nombre}`,
    `📧 Email: ${data.email}`,
    data.telefono ? `📱 Teléfono: ${data.telefono}` : '',
    '',
    `💬 Mensaje: ${data.mensaje.length > 300 ? data.mensaje.substring(0, 300) + '...' : data.mensaje}`,
    '— Pastas Orlando',
  ].filter(Boolean).join('\n');

  const result = await sendWhatsAppMessage(message);

  if (result.sent) {
    console.log('[CONSULTA] WhatsApp enviado con éxito');
  } else {
    console.error(`[CONSULTA] Error en WhatsApp: ${result.reason || 'desconocido'}`);
  }

  return result;
}
