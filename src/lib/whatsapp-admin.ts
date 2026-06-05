// ---------------------------------------------------------------------------
// WhatsApp Admin Notification — TextMeBot API
// ---------------------------------------------------------------------------
//
// Sends a WhatsApp message to the admin whenever someone requests a password
// reset.  This MUST be awaited by the caller so the serverless function
// doesn't terminate before the fetch completes.
//
// API docs: https://api.textmebot.com/send.php
// Parameters: recipient (without +), apikey, text
// ---------------------------------------------------------------------------

interface PasswordResetNotificationData {
  email: string;
  ip: string;
  emailExiste: boolean;
  fecha?: string;
}

/**
 * Notifies the admin via WhatsApp that a password-reset was requested.
 *
 * ⚠️  The caller SHOULD await this function. In Vercel serverless, an
*  un-awaited fire-and-forget fetch will be killed when the function
 * terminates. We still catch errors internally so the recovery flow
 * is never broken.
 */
export async function notifyAdminPasswordReset(
  data: PasswordResetNotificationData,
): Promise<void> {
  const adminPhone = process.env.ADMIN_WHATSAPP || '543754419324';
  const apiKey = process.env.TEXTMEBOT_APIKEY;

  console.log(`[whatsapp-admin] Config check — ADMIN_WHATSAPP: "${adminPhone}" | TEXTMEBOT_APIKEY: "${apiKey ? apiKey.substring(0, 4) + '***' : '(not set)'}"`);

  // If no API key is configured (e.g. dev environment), just log and exit.
  if (!apiKey) {
    console.warn(
      '[whatsapp-admin] ⚠️ TEXTMEBOT_APIKEY not set — skipping admin notification.',
    );
    return;
  }

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

  const url =
    `https://api.textmebot.com/send.php` +
    `?recipient=${encodeURIComponent(adminPhone)}` +
    `&apikey=${encodeURIComponent(apiKey)}` +
    `&text=${encodeURIComponent(message)}`;

  // Log the URL with masked apikey for debugging
  const maskedUrl = url.replace(/apikey=[^&]+/, 'apikey=***');
  console.log(`[whatsapp-admin] Sending to TextMeBot: ${maskedUrl}`);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });

    const body = await res.text();
    console.log(`[whatsapp-admin] TextMeBot response status: ${res.status} | body: ${body}`);

    if (res.ok || body.toLowerCase().includes('success')) {
      console.log(
        `[whatsapp-admin] ✅ Admin notified for password-reset request from "${data.email}"`,
      );
    } else {
      console.error(
        `[whatsapp-admin] ❌ TextMeBot responded with status ${res.status}: ${body}`,
      );
    }
  } catch (err) {
    console.error(
      '[whatsapp-admin] ❌ Failed to send WhatsApp notification:',
      err,
    );
    // Don't throw — WhatsApp failure must not break the recovery flow
  }
}
