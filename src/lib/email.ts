import { sendMail } from '@/lib/smtp-transporter';

// ---------------------------------------------------------------------------
// HTML Email Template
// ---------------------------------------------------------------------------

function buildPasswordResetHtml(resetUrl: string): string {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña - Pastas Orlando</title>
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* Base */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #FFF8E7; /* Crema */
      color: #5C3A21; /* Marrón */
      -webkit-font-smoothing: antialiased;
    }

    /* Wrapper */
    .email-wrapper {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Card */
    .email-card {
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(92, 58, 33, 0.10);
    }

    /* Header */
    .email-header {
      background: linear-gradient(135deg, #5C3A21 0%, #7A4E2D 100%);
      padding: 36px 32px;
      text-align: center;
    }
    .email-header .brand-name {
      font-size: 28px;
      font-weight: 800;
      color: #E1AD01; /* Mostaza */
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .email-header .brand-tagline {
      font-size: 13px;
      color: #FFF8E7; /* Crema */
      margin-top: 6px;
      letter-spacing: 0.5px;
      opacity: 0.85;
    }
    .email-header .brand-icon {
      font-size: 40px;
      margin-bottom: 8px;
    }

    /* Body */
    .email-body {
      padding: 40px 32px 32px;
      text-align: center;
    }
    .email-body h1 {
      font-size: 24px;
      font-weight: 700;
      color: #5C3A21;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .email-body p {
      font-size: 15px;
      line-height: 1.7;
      color: #5C3A21;
      opacity: 0.80;
      margin-bottom: 12px;
    }

    /* CTA Button */
    .btn-wrapper {
      margin: 32px 0;
    }
    .btn-reset {
      display: inline-block;
      background-color: #E1AD01; /* Mostaza */
      color: #5C3A21; /* Marrón */
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      transition: background-color 0.2s;
    }
    .btn-reset:hover {
      background-color: #C89800;
    }

    /* Fallback link */
    .fallback-link {
      font-size: 13px;
      color: #5C3A21;
      opacity: 0.60;
      word-break: break-all;
      margin-top: 16px;
    }
    .fallback-link a {
      color: #E1AD01;
      text-decoration: underline;
    }

    /* Divider */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #E1AD01 50%, transparent);
      margin: 28px 0 0;
      opacity: 0.4;
    }

    /* Footer */
    .email-footer {
      padding: 24px 32px 28px;
      text-align: center;
    }
    .email-footer p {
      font-size: 12px;
      color: #5C3A21;
      opacity: 0.50;
      line-height: 1.6;
    }
    .email-footer .footer-brand {
      font-weight: 700;
      opacity: 0.70;
    }

    /* Responsive */
    @media only screen and (max-width: 480px) {
      .email-wrapper { padding: 12px; }
      .email-header { padding: 28px 20px; }
      .email-header .brand-name { font-size: 22px; }
      .email-body { padding: 28px 20px 24px; }
      .email-body h1 { font-size: 20px; }
      .btn-reset { padding: 14px 28px; font-size: 14px; }
      .email-footer { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">

      <!-- Header -->
      <div class="email-header">
        <div class="brand-icon">🍝</div>
        <div class="brand-name">Pastas Orlando</div>
        <div class="brand-tagline">Artesanía italiana desde Posadas, Misiones</div>
      </div>

      <!-- Body -->
      <div class="email-body">
        <h1>Restablecer tu contraseña</h1>
        <p>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Haz clic en el botón de abajo para elegir una nueva contraseña.
        </p>

        <div class="btn-wrapper">
          <a href="${resetUrl}" class="btn-reset" target="_blank" rel="noopener noreferrer">
            Restablecer Contraseña
          </a>
        </div>

        <p>
          Si no solicitaste este cambio, puedes ignorar este correo.
          Tu contraseña actual permanecerá sin modificaciones.
        </p>

        <div class="divider"></div>

        <p class="fallback-link">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <p>
          <span class="footer-brand">Pastas Orlando</span> — Posadas, Misiones, Argentina<br />
          Este correo fue enviado desde <a href="${APP_URL}" style="color:#E1AD01;">${APP_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Plain-text fallback
// ---------------------------------------------------------------------------

function buildPasswordResetText(resetUrl: string): string {
  return `
Pastas Orlando - Restablecer tu contraseña
============================================

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Haz clic en el siguiente enlace para elegir una nueva contraseña:

${resetUrl}

Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual permanecerá sin modificaciones.

--
Pastas Orlando - Posadas, Misiones, Argentina
`.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a password-reset email with a branded HTML template.
 *
 * The transporter is created INSIDE this function on every call so that
 * process.env is always read fresh (Vercel serverless may not have env
 * vars available at module-import time).
 *
 * Errors are logged with full detail — never silently swallowed.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  // ── Diagnostic logs ──────────────────────────────────────────────
  console.log('[RECOVERY-Email] Enviando email a:', email);
  console.log('[RECOVERY-Email] SMTP_USER existe?', !!process.env.SMTP_USER);
  console.log('[RECOVERY-Email] SMTP_PASS existe?', !!process.env.SMTP_PASS);
  console.log('[RECOVERY-Email] SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
  console.log('[RECOVERY-Email] SMTP_PORT:', process.env.SMTP_PORT || '(not set)');
  console.log('[RECOVERY-Email] SMTP_SECURE:', process.env.SMTP_SECURE || '(not set)');
  console.log('[RECOVERY-Email] SMTP_FROM:', process.env.SMTP_FROM || '(not set)');

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error('[RECOVERY-Email] ❌ FALTAN CREDENCIALES — SMTP_USER o SMTP_PASS no están configurados');
    return;
  }

  console.log('[RECOVERY-Email] Usando transporter pooled (pool=true)...');

  try {
    const result = await sendMail({
      to: email,
      subject: 'Restablecer tu contraseña — Pastas Orlando',
      html: buildPasswordResetHtml(resetUrl),
      text: buildPasswordResetText(resetUrl),
    });

    console.log(
      `[RECOVERY-Email] ✅ Email enviado OK a "${email}" — messageId: ${result.messageId}`,
    );
  } catch (error) {
    console.error(`[RECOVERY-Email] ❌ ERROR enviando email a "${email}":`, error);
    // Don't re-throw — email failure must not break the recovery flow
  }
}
