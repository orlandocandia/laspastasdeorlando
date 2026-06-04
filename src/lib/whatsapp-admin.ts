// ---------------------------------------------------------------------------
// WhatsApp Admin Notification — CallMeBot API
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
  fecha: string;
}

/**
 * Notifies the admin via WhatsApp that a password-reset was requested.
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
  const apiKey = process.env.CALLMEBOT_APIKEY;

  // If no API key is configured (e.g. dev environment), just log and exit.
  if (!apiKey) {
    console.warn(
      '[whatsapp-admin] CALLMEBOT_APIKEY not set — skipping admin notification.',
    );
    return;
  }

  // Build a concise, readable message
  const message = [
    '🔐 *Solicitud de restablecimiento de contraseña*',
    `📅 Fecha: ${data.fecha}`,
    `📧 Email: ${data.email}`,
    `🌐 IP: ${data.ip}`,
    `${data.emailExiste ? '✅ Email registrado en BD' : '❌ Email NO registrado en BD'}`,
    '— Pastas Orlando',
  ].join('\n');

  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(adminPhone)}` +
    `&text=${encodeURIComponent(message)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  // Fire-and-forget: we use `.catch()` so the promise never becomes
  // unhandled and the error is logged without propagating.
  fetch(url, { method: 'GET' })
    .then((res) => {
      if (!res.ok) {
        console.error(
          `[whatsapp-admin] CallMeBot responded with status ${res.status}`,
        );
      } else {
        console.log(
          `[whatsapp-admin] Admin notified for password-reset request from "${data.email}"`,
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
