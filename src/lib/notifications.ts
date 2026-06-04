import nodemailer from 'nodemailer'

interface ConsultaData {
  nombre: string
  email: string
  telefono: string
  mensaje: string
}

/**
 * Send email + WhatsApp notifications when a new consulta is received.
 * Each channel catches its own errors independently.
 */
export async function sendConsultaNotifications(data: ConsultaData) {
  console.log('[Notif] 📨 Nueva consulta de:', data.nombre, '|', data.email)

  // Run both in parallel — one failing doesn't affect the other
  const results = await Promise.allSettled([
    sendEmailNotification(data),
    sendWhatsAppNotification(data),
  ])

  const emailStatus = results[0].status === 'fulfilled' ? '✅' : '❌'
  const waStatus = results[1].status === 'fulfilled' ? '✅' : '❌'
  console.log(`[Notif] Resultados: Email ${emailStatus} | WhatsApp ${waStatus}`)
}

/**
 * Email notification via nodemailer (Gmail SMTP).
 * Requires env vars: SMTP_USER, SMTP_PASS
 * Optional: SMTP_HOST (default: smtp.gmail.com), SMTP_PORT (default: 587), ADMIN_EMAIL
 */
async function sendEmailNotification(data: ConsultaData) {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpUser || !smtpPass) {
    console.log('[Notif-Email] ⚠️ SMTP credentials not configured (SMTP_USER/SMTP_PASS missing), skipping email')
    return
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  const adminEmail = process.env.ADMIN_EMAIL || smtpUser

  console.log(`[Notif-Email] Conectando a ${smtpHost}:${smtpPort} como ${smtpUser} → enviando a ${adminEmail}`)

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  const whatsappReplyLink = data.telefono
    ? `https://wa.me/${data.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${data.nombre}, gracias por contactarte con Pastas Orlando.`)}`
    : null

  try {
    const info = await transporter.sendMail({
      from: `"Pastas Orlando Web" <${smtpUser}>`,
      to: adminEmail,
      subject: '📧 Nuevo mensaje de contacto - Pastas Orlando',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Encabezado -->
          <div style="background: #E1AD01; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #5C3A21; margin: 0; font-size: 22px;">🍝 Pastas Orlando</h1>
          </div>

          <!-- Cuerpo -->
          <div style="background: #FFF8E7; padding: 24px; border-radius: 0 0 8px 8px;">

            <p style="color: #5C3A21; font-size: 16px; margin: 0 0 6px;">
              ¡Hola Orlando! 👋
            </p>
            <p style="color: #333; font-size: 14px; margin: 0 0 20px; line-height: 1.5;">
              Tienes un nuevo mensaje de contacto desde tu página web. Aquí están los datos del cliente para que puedas responderle a la brevedad:
            </p>

            <!-- Detalles -->
            <p style="color: #5C3A21; font-weight: bold; font-size: 14px; margin: 0 0 10px;">
              📝 Detalles de la consulta:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 12px; color: #5C3A21; font-weight: bold; width: 40px; font-size: 16px;">👤</td>
                <td style="padding: 8px 0; color: #5C3A21; font-weight: bold; width: 80px;">Nombre:</td>
                <td style="padding: 8px 0; color: #333;">${data.nombre}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; color: #E1AD01; font-size: 16px;">📧</td>
                <td style="padding: 8px 0; color: #5C3A21; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #E1AD01; text-decoration: underline;">${data.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; color: #25D366; font-size: 16px;">📞</td>
                <td style="padding: 8px 0; color: #5C3A21; font-weight: bold;">Teléfono:</td>
                <td style="padding: 8px 0; color: #333;">${data.telefono || '-'}</td>
              </tr>
            </table>

            <!-- Mensaje -->
            <p style="color: #5C3A21; font-weight: bold; font-size: 14px; margin: 0 0 8px;">💬 Mensaje:</p>
            <div style="padding: 14px 16px; background: white; border-radius: 8px; border-left: 4px solid #E1AD01; margin-bottom: 24px;">
              <p style="color: #333; margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6; font-style: italic;">"${data.mensaje}"</p>
            </div>

            <!-- Botones -->
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://laspastasdeorlando.vercel.app/admin/consultas"
                 style="background: #E1AD01; color: #5C3A21; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Ver en el Panel Admin
              </a>
              ${whatsappReplyLink ? `
              <a href="${whatsappReplyLink}"
                 style="background: #25D366; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-left: 8px;">
                📱 Responder por WhatsApp
              </a>` : ''}
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #E1AD01; padding-top: 12px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                🌐 Este mensaje fue enviado automáticamente desde la web de Pastas Orlando.
              </p>
            </div>
          </div>
        </div>
      `,
    })

    console.log('[Notif-Email] ✅ Email enviado OK — MessageId:', info.messageId)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const errCode = (error as { code?: string })?.code || ''
    console.error(`[Notif-Email] ❌ Error enviando email [${errCode}]: ${errMsg}`)
  } finally {
    transporter.close()
  }
}

/**
 * WhatsApp notification via TextMeBot API.
 * Requires env vars: ADMIN_WHATSAPP, TEXTMEBOT_APIKEY
 * This is optional — if not configured, it silently skips.
 *
 * SETUP: Get your API key at https://textmebot.com
 */
async function sendWhatsAppNotification(data: ConsultaData) {
  const adminPhone = process.env.ADMIN_WHATSAPP || '543754419324'
  const apiKey = process.env.TEXTMEBOT_APIKEY

  if (!apiKey) {
    console.log('[Notif-WA] ⚠️ WhatsApp no configurado (falta TEXTMEBOT_APIKEY), se saltea')
    return
  }

  const waMessage = [
    `📋 *Nueva consulta - Pastas Orlando*`,
    ``,
    `👤 ${data.nombre}`,
    `📧 ${data.email}`,
    data.telefono ? `📱 ${data.telefono}` : '',
    ``,
    `💬 ${data.mensaje.length > 200 ? data.mensaje.substring(0, 200) + '...' : data.mensaje}`,
  ].filter(Boolean).join('\n')

  const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(adminPhone)}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(waMessage)}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`[Notif-WA] ❌ TextMeBot error ${response.status}: ${body}`)
      return
    }

    console.log('[Notif-WA] ✅ WhatsApp enviado OK a', adminPhone)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Notif-WA] ❌ Error enviando WhatsApp: ${errMsg}`)
  }
}
