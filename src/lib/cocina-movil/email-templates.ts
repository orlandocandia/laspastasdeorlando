/**
 * ============================================================
 * Cocina Móvil — Plantillas de email HTML
 * ============================================================
 *
 * Plantillas profesionales para emails de la Cocina Móvil.
 * Estilos inline (compatibles con todos los clientes de email).
 * Colores de marca: marron #5C3A21, mostaza #E1AD01, crema #FFF8E7,
 * oliva #708238, rojo #B91C1C.
 * ============================================================
 */

const BRAND = {
  marron: '#5C3A21',
  mostaza: '#E1AD01',
  crema: '#FFF8E7',
  oliva: '#708238',
  rojo: '#B91C1C',
  grisOscuro: '#3a2614',
  grisMedio: '#8A7E70',
  blanco: '#FFFFFF',
}

/**
 * Email de restablecimiento de contraseña.
 * Formato HTML completo con estilos inline.
 */
export function buildPasswordResetEmailHtml(params: {
  userName: string
  resetUrl: string
  expiresInHours?: number
}): string {
  const { userName, resetUrl, expiresInHours = 1 } = params
  const appName = 'Cocina Móvil'
  const parentBrand = 'El Amigo de las Pastas'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña — ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.crema};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;color:${BRAND.marron};">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.crema};padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.blanco};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(92,58,33,0.10);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.marron} 0%,${BRAND.grisOscuro} 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:11px;letter-spacing:2px;color:${BRAND.mostaza};text-transform:uppercase;font-weight:600;margin-bottom:8px;">${parentBrand}</div>
              <div style="font-size:28px;font-weight:800;color:${BRAND.blanco};letter-spacing:0.5px;">${appName}</div>
              <div style="font-size:13px;color:${BRAND.crema};font-style:italic;margin-top:6px;opacity:0.85;">Pastas artesanales con sabor a tradición</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 8px 32px;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:${BRAND.marron};">Restablecer tu contraseña</h1>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#4A3F36;">Hola <strong style="color:${BRAND.marron};">${userName}</strong>,</p>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#4A3F36;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en ${appName}. Si realizaste esta solicitud, hacé clic en el botón de abajo para crear una nueva contraseña.</p>
              <!-- Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;background-color:${BRAND.mostaza};color:${BRAND.marron};font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;box-shadow:0 4px 12px rgba(225,173,1,0.30);border:2px solid ${BRAND.mostaza};">Restablecer contraseña</a>
                  </td>
                </tr>
              </table>
              <!-- Aviso de expiración -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;">
                <tr>
                  <td style="background-color:rgba(225,173,1,0.10);border-left:4px solid ${BRAND.mostaza};padding:12px 14px;border-radius:0 6px 6px 0;">
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#7a5c00;"><strong>⏰ Este enlace expira en ${expiresInHours} hora${expiresInHours > 1 ? 's' : ''}.</strong> Si no solicitaste este cambio, podés ignorar este mensaje y tu contraseña permanecerá sin cambios.</p>
                  </td>
                </tr>
              </table>
              <!-- Link alternativo -->
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:${BRAND.grisMedio};">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
              <p style="margin:0 0 24px 0;font-size:12px;line-height:1.5;color:${BRAND.marron};word-break:break-all;background-color:${BRAND.crema};padding:10px 12px;border-radius:6px;border:1px solid #E6DAC2;font-family:monospace;">${resetUrl}</p>
              <!-- Separador -->
              <hr style="border:none;border-top:1px solid #E6DAC2;margin:0 0 20px 0;" />
              <!-- Seguridad -->
              <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.grisMedio};"><strong style="color:${BRAND.marron};">🔒 Medida de seguridad:</strong> Nunca compartimos tu contraseña por email. El equipo de ${appName} nunca te pedirá tu contraseña. Si recibiste este email por error, simplemente ignoralo.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.crema};padding:24px 32px;text-align:center;border-top:1px solid #E6DAC2;">
              <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:${BRAND.marron};">${parentBrand} · ${appName}</p>
              <p style="margin:0 0 8px 0;font-size:11px;color:${BRAND.grisMedio};font-style:italic;">Pastas artesanales con sabor a tradición</p>
              <p style="margin:0 0 4px 0;font-size:11px;color:${BRAND.grisMedio};">Posadas · Misiones · Argentina</p>
              <p style="margin:8px 0 0 0;font-size:10px;color:${BRAND.grisMedio};opacity:0.7;">© ${new Date().getFullYear()} ${parentBrand}. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Versión texto plano del email (fallback para clientes que no soportan HTML).
 */
export function buildPasswordResetEmailText(params: {
  userName: string
  resetUrl: string
  expiresInHours?: number
}): string {
  const { userName, resetUrl, expiresInHours = 1 } = params
  return `El Amigo de las Pastas — Cocina Móvil
Pastas artesanales con sabor a tradición

Hola ${userName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en Cocina Móvil.

Para crear una nueva contraseña, visitá el siguiente enlace (expira en ${expiresInHours} hora${expiresInHours > 1 ? 's' : ''}):

${resetUrl}

Si no solicitaste este cambio, podés ignorar este mensaje y tu contraseña permanecerá sin cambios.

— El Amigo de las Pastas · Cocina Móvil
Posadas · Misiones · Argentina`
}
