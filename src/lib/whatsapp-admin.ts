// ---------------------------------------------------------------------------
// WhatsApp Admin Notification — TextMeBot API
// ---------------------------------------------------------------------------
//
// Sends a fire-and-forget WhatsApp message to the admin whenever someone
// requests a password reset.  This must NEVER block or break the calling
// flow, so every error is swallowed after logging.
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
 * Uses TextMeBot API: https://api.textmebot.com/send.php
 * Parameters: recipient (without +), apikey, text
 *
 * ⚠️  This function is async but designed to be called in fire-and-forget
 * fashion.  The caller should NOT await it if doing so would block the
 * password-recovery flow.
 *
 * Example usage (non-blocking):
 * ```ts
 * notifyAdminPasswordReset(data);          // fire-and-forget
 * // or, if you want to at least catch in the current scope:
 * notifyAdminPasswordReset(data).catch(() => {});
 * ```
 */
export async function notifyAdminPasswordReset(
  data: PasswordResetNotificationData,
): Promise<void> {
  const adminPhone = process.env.ADMIN_WHATSAPP || '543754419324';
  const apiKey = process.env.TEXTMEBOT_APIKEY;

  // If no API key is configured (e.g. dev environment), just log and exit.
  if (!apiKey) {
    console.warn(
      '[whatsapp-admin] TEXTMEBOT_APIKEY not set — skipping admin notification.',
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

  // Fire-and-forget: we use `.catch()` so the promise never becomes
  // unhandled and the error is logged without propagating.
  fetch(url, { method: 'GET' })
    .then(async (res) => {
      const text = await res.text();
      if (res.ok || text.toLowerCase().includes('success')) {
        console.log(
          `[whatsapp-admin] Admin notified for password-reset request from "${data.email}"`,
        );
      } else {
        console.error(
          `[whatsapp-admin] TextMeBot responded with status ${res.status}: ${text}`,
        );
      }
    })
    .catch((err) => {
      console.error(
        '[whatsapp-admin] Failed to send WhatsApp notification:',
        err,
      );
    });
}
