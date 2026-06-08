/**
 * Servicio de notificaciones para Pastas Orlando
 * Maneja envío de emails, WhatsApp y procesamiento de alertas
 *
 * Usa el mismo transporte SMTP pooled que el resto del sistema
 * (smtp-transporter.ts) y TextMeBot para WhatsApp (whatsapp-admin.ts).
 */

import { db } from '@/lib/db'
import { renderPlantilla } from '@/lib/plantillas'
import { sendMail } from '@/lib/smtp-transporter'

// ============================================
// ENVÍO DE EMAIL (REAL — usa SMTP pooled)
// ============================================

interface EmailResult {
  success: boolean
  message?: string
  error?: string
  destinatario: string
  asunto: string
}

/**
 * Envía un email real usando el transporte SMTP compartido (pool=true).
 * El mismo que usan el formulario de contacto y la recuperación de contraseña.
 */
export async function enviarEmail(
  destinatario: string,
  asunto: string,
  mensaje: string
): Promise<EmailResult> {
  try {
    console.log(`[NOTIF-EMAIL] Enviando a: ${destinatario}, Asunto: ${asunto}`)

    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpUser || !smtpPass) {
      console.error('[NOTIF-EMAIL] ❌ SMTP_USER o SMTP_PASS no configurados')
      return {
        success: false,
        error: 'Credenciales SMTP no configuradas',
        destinatario,
        asunto,
      }
    }

    // Detectar si el mensaje ya es HTML (tiene etiquetas) o es texto plano
    const isHtml = /<[a-z][\s\S]*>/i.test(mensaje)

    const htmlContent = isHtml
      ? mensaje
      : `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF8E7;">
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #5C3A21 0%, #7A4E2D 100%); padding: 28px 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="font-size: 32px; margin-bottom: 4px;">🍝</div>
            <div style="font-size: 22px; font-weight: 800; color: #E1AD01; letter-spacing: 1.5px;">PASTAS ORLANDO</div>
          </div>
          <!-- Cuerpo -->
          <div style="background: #ffffff; padding: 32px 28px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 24px rgba(92,58,33,0.10);">
            <div style="color: #5C3A21; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${mensaje}</div>
          </div>
          <!-- Footer -->
          <div style="text-align: center; padding: 16px 0; color: #5C3A21; opacity: 0.5; font-size: 12px;">
            Pastas Orlando — Posadas, Misiones, Argentina
          </div>
        </div>`

    const textContent = isHtml ? undefined : mensaje

    const result = await sendMail({
      to: destinatario,
      subject: asunto,
      html: htmlContent,
      text: textContent,
    })

    console.log(`[NOTIF-EMAIL] ✅ Email enviado OK a "${destinatario}" — messageId: ${result.messageId}`)

    return {
      success: true,
      message: 'Email enviado correctamente',
      destinatario,
      asunto,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.error(`[NOTIF-EMAIL] ❌ Error enviando email a "${destinatario}":`, errMsg)
    return {
      success: false,
      error: errMsg,
      destinatario,
      asunto,
    }
  }
}

// ============================================
// ENVÍO DE WHATSAPP (REAL — usa TextMeBot)
// ============================================

interface WhatsAppResult {
  success: boolean
  message?: string
  error?: string
  destinatario: string
  link?: string
}

/**
 * Envía un WhatsApp real usando TextMeBot (la misma API que usa
 * whatsapp-admin.ts para notificaciones de contacto y recuperación).
 *
 * Si TextMeBot no está configurado, genera un link wa.me como fallback.
 */
export async function enviarWhatsApp(
  destinatario: string,
  mensaje: string
): Promise<WhatsAppResult> {
  try {
    // Limpiar número de teléfono (solo dígitos)
    const numeroLimpio = destinatario.replace(/\D/g, '')

    // Agregar código de país si no lo tiene (Argentina: 54)
    const numeroCompleto = numeroLimpio.startsWith('54')
      ? numeroLimpio
      : `54${numeroLimpio}`

    const apiKey = process.env.TEXTMEBOT_APIKEY

    // Si hay API key de TextMeBot, enviar realmente
    if (apiKey) {
      console.log(`[NOTIF-WHATSAPP] Enviando via TextMeBot a: ${numeroCompleto}`)

      const url =
        `https://api.textmebot.com/send.php` +
        `?recipient=${encodeURIComponent(numeroCompleto)}` +
        `&apikey=${encodeURIComponent(apiKey)}` +
        `&text=${encodeURIComponent(mensaje)}`

      const res = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(15_000),
      })

      const body = await res.text()
      console.log(`[NOTIF-WHATSAPP] TextMeBot response: status=${res.status} body=${body}`)

      if (res.ok || body.toLowerCase().includes('success')) {
        return {
          success: true,
          message: 'WhatsApp enviado correctamente via TextMeBot',
          destinatario,
        }
      } else {
        const errorMsg = `TextMeBot respondió con status ${res.status}: ${body}`
        console.error(`[NOTIF-WHATSAPP] ❌ ${errorMsg}`)
        return {
          success: false,
          error: errorMsg,
          destinatario,
        }
      }
    }

    // Fallback: generar link wa.me si no hay API key
    console.log(`[NOTIF-WHATSAPP] TEXTMEBOT_APIKEY no configurado — generando link wa.me`)
    const mensajeEncoded = encodeURIComponent(mensaje)
    const link = `https://wa.me/${numeroCompleto}?text=${mensajeEncoded}`

    return {
      success: true,
      message: 'Link de WhatsApp generado (TextMeBot no configurado)',
      destinatario,
      link,
    }
  } catch (error) {
    console.error('[NOTIF-WHATSAPP] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      destinatario,
    }
  }
}

// ============================================
// ENVÍO GENÉRICO DE NOTIFICACIÓN
// ============================================

interface SendNotificationParams {
  id_plantilla?: number | null
  tipo: 'email' | 'whatsapp'
  destinatario: string
  asunto?: string
  mensaje: string
  variables?: Record<string, string>
  fecha_programada?: string | null
  metadata?: Record<string, unknown> | null
}

interface SendNotificationResult {
  success: boolean
  notificacion: Record<string, unknown>
  envio?: EmailResult | WhatsAppResult
  error?: string
}

/**
 * Envía una notificación y la registra en la base de datos
 */
export async function enviarNotificacion(
  params: SendNotificationParams
): Promise<SendNotificationResult> {
  const {
    id_plantilla,
    tipo,
    destinatario,
    asunto,
    mensaje,
    variables,
    fecha_programada,
    metadata,
  } = params

  let mensajeFinal = mensaje
  let asuntoFinal = asunto || null

  // Si hay plantilla, renderizar con variables
  if (id_plantilla) {
    const plantilla = await db.plantillaNotificacion.findUnique({
      where: { id: id_plantilla },
    })

    if (!plantilla) {
      return {
        success: false,
        notificacion: {},
        error: 'Plantilla no encontrada',
      }
    }

    if (!plantilla.activo) {
      return {
        success: false,
        notificacion: {},
        error: 'La plantilla está desactivada',
      }
    }

    // Renderizar mensaje y asunto de la plantilla
    mensajeFinal = renderPlantilla(plantilla.mensaje, variables || {})
    if (plantilla.asunto) {
      asuntoFinal = renderPlantilla(plantilla.asunto, variables || {})
    }
  } else if (variables && Object.keys(variables).length > 0) {
    // Si no hay plantilla pero hay variables, renderizar el mensaje directo
    mensajeFinal = renderPlantilla(mensaje, variables)
    if (asuntoFinal) {
      asuntoFinal = renderPlantilla(asuntoFinal, variables)
    }
  }

  // Crear registro de notificación
  const notificacion = await db.notificacion.create({
    data: {
      id_plantilla: id_plantilla || null,
      tipo,
      destinatario,
      asunto: asuntoFinal,
      mensaje: mensajeFinal,
      estado: 'pendiente',
      fecha_programada: fecha_programada ? new Date(fecha_programada) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })

  // Intentar enviar según el tipo
  let envio: EmailResult | WhatsAppResult | undefined
  let estadoFinal = 'pendiente'
  let errorEnvio: string | null = null

  if (!fecha_programada) {
    // Enviar inmediatamente si no está programada
    if (tipo === 'email') {
      envio = await enviarEmail(destinatario, asuntoFinal || '(Sin asunto)', mensajeFinal)
      estadoFinal = envio.success ? 'enviado' : 'error'
      errorEnvio = envio.success ? null : envio.error || null
    } else if (tipo === 'whatsapp') {
      envio = await enviarWhatsApp(destinatario, mensajeFinal)
      estadoFinal = envio.success ? 'enviado' : 'error'
      errorEnvio = envio.success ? null : envio.error || null
    }

    // Actualizar estado en la base de datos
    await db.notificacion.update({
      where: { id: notificacion.id },
      data: {
        estado: estadoFinal,
        fecha_envio: estadoFinal === 'enviado' ? new Date() : null,
        error: errorEnvio,
      },
    })
  }

  // Obtener la notificación actualizada
  const notificacionActualizada = await db.notificacion.findUnique({
    where: { id: notificacion.id },
    include: { plantilla: { select: { id: true, nombre: true } } },
  })

  return {
    success: estadoFinal !== 'error',
    notificacion: notificacionActualizada || notificacion,
    envio,
    ...(errorEnvio ? { error: errorEnvio } : {}),
  }
}

// ============================================
// PROCESAMIENTO DE ALERTAS
// ============================================

interface AlertaResultado {
  tipo: string
  ejecutada: boolean
  notificacionesEnviadas: number
  detalles: string[]
  error?: string
}

/**
 * Procesa alerta de stock bajo
 * Busca productos terminados y materias primas con stock por debajo del mínimo
 */
export async function procesarAlertaStockBajo(): Promise<AlertaResultado> {
  const resultado: AlertaResultado = {
    tipo: 'stock_bajo',
    ejecutada: false,
    notificacionesEnviadas: 0,
    detalles: [],
  }

  try {
    // Obtener configuración de la alerta
    const config = await db.alertaConfiguracion.findUnique({
      where: { tipo: 'stock_bajo' },
    })

    if (!config || !config.activo) {
      resultado.detalles.push('Alerta de stock bajo desactivada o no configurada')
      return resultado
    }

    // Buscar productos terminados con stock bajo
    const productosBajoStock = await db.productoTerminado.findMany({
      where: {
        estado: true,
        stock_actual: { lte: db.productoTerminado.fields.stock_minimo ? 0 : 0 },
      },
    })

    // También buscar con filtro más flexible
    const productosStockBajo = await db.productoTerminado.findMany({
      where: { estado: true },
    }).then(productos =>
      productos.filter(p => p.stock_actual <= p.stock_minimo && p.stock_minimo > 0)
    )

    // Buscar materias primas con stock bajo
    const materiasPrimasStockBajo = await db.materiaPrima.findMany({
      where: { estado: true },
    }).then(mp =>
      mp.filter(m => m.stock_actual <= m.stock_minimo && m.stock_minimo > 0)
    )

    // Buscar insumos con stock bajo
    const insumosStockBajo = await db.insumo.findMany({
      where: { estado: true },
    }).then(ins =>
      ins.filter(i => i.stock_actual <= i.stock_minimo && i.stock_minimo > 0)
    )

    const totalItems = productosStockBajo.length + materiasPrimasStockBajo.length + insumosStockBajo.length

    if (totalItems === 0) {
      resultado.detalles.push('No hay items con stock bajo')
      resultado.ejecutada = true
      return resultado
    }

    resultado.detalles.push(
      `${productosStockBajo.length} productos terminados con stock bajo`,
      `${materiasPrimasStockBajo.length} materias primas con stock bajo`,
      `${insumosStockBajo.length} insumos con stock bajo`
    )

    // Enviar notificaciones a los destinatarios configurados
    const destinatarios: string[] = config.destinatarios
      ? JSON.parse(config.destinatarios)
      : []

    for (const dest of destinatarios) {
      const esEmail = dest.includes('@')
      const itemsList = [
        ...productosStockBajo.map(p => `- ${p.nombre}: ${p.stock_actual}/${p.stock_minimo}`),
        ...materiasPrimasStockBajo.map(m => `- ${m.nombre}: ${m.stock_actual}/${m.stock_minimo}`),
        ...insumosStockBajo.map(i => `- ${i.nombre}: ${i.stock_actual}/${i.stock_minimo}`),
      ].join('\n')

      const mensaje = `⚠️ ALERTA DE STOCK BAJO\n\n${totalItems} items con stock bajo:\n\n${itemsList}`

      const notifResult = await enviarNotificacion({
        tipo: esEmail ? 'email' : 'whatsapp',
        destinatario: dest,
        asunto: 'Alerta de Stock Bajo - Pastas Orlando',
        mensaje,
      })

      if (notifResult.success) {
        resultado.notificacionesEnviadas++
      }
    }

    // Actualizar último envío
    await db.alertaConfiguracion.update({
      where: { tipo: 'stock_bajo' },
      data: { ultimo_envio: new Date() },
    })

    resultado.ejecutada = true
  } catch (error) {
    resultado.error = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en procesarAlertaStockBajo:', error)
  }

  return resultado
}

/**
 * Procesa alerta de pedidos pendientes
 * Busca pedidos de clientes que llevan mucho tiempo sin ser completados
 */
export async function procesarAlertaPedidoPendiente(): Promise<AlertaResultado> {
  const resultado: AlertaResultado = {
    tipo: 'pedido_pendiente',
    ejecutada: false,
    notificacionesEnviadas: 0,
    detalles: [],
  }

  try {
    const config = await db.alertaConfiguracion.findUnique({
      where: { tipo: 'pedido_pendiente' },
    })

    if (!config || !config.activo) {
      resultado.detalles.push('Alerta de pedidos pendientes desactivada o no configurada')
      return resultado
    }

    // Buscar estados de pedido pendiente/en proceso
    const estadosPendientes = await db.estadoGeneral.findMany({
      where: {
        entidad_aplicable: { contains: 'pedido' },
        nombre_estado: { in: ['pendiente', 'confirmado', 'en_proceso'] },
      },
    })

    const estadoIds = estadosPendientes.map(e => e.id)

    const pedidosPendientes = await db.pedidoCliente.findMany({
      where: {
        id_estado: { in: estadoIds },
      },
      include: {
        cliente: {
          select: { nombre: true, apellido: true, razon_social: true },
        },
        estado: true,
      },
      orderBy: { fecha_pedido: 'asc' },
    })

    if (pedidosPendientes.length === 0) {
      resultado.detalles.push('No hay pedidos pendientes')
      resultado.ejecutada = true
      return resultado
    }

    resultado.detalles.push(`${pedidosPendientes.length} pedidos pendientes encontrados`)

    // Enviar notificaciones
    const destinatarios: string[] = config.destinatarios
      ? JSON.parse(config.destinatarios)
      : []

    for (const dest of destinatarios) {
      const esEmail = dest.includes('@')
      const pedidosList = pedidosPendientes
        .slice(0, 10)
        .map(p => `- Pedido #${p.id}: ${p.cliente.razon_social || `${p.cliente.nombre} ${p.cliente.apellido}`} - ${p.estado.nombre_estado}`)
        .join('\n')

      const mensaje = `📋 ALERTA DE PEDIDOS PENDIENTES\n\n${pedidosPendientes.length} pedidos pendientes:\n\n${pedidosList}${pedidosPendientes.length > 10 ? '\n... y más' : ''}`

      const notifResult = await enviarNotificacion({
        tipo: esEmail ? 'email' : 'whatsapp',
        destinatario: dest,
        asunto: 'Alerta de Pedidos Pendientes - Pastas Orlando',
        mensaje,
      })

      if (notifResult.success) {
        resultado.notificacionesEnviadas++
      }
    }

    await db.alertaConfiguracion.update({
      where: { tipo: 'pedido_pendiente' },
      data: { ultimo_envio: new Date() },
    })

    resultado.ejecutada = true
  } catch (error) {
    resultado.error = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en procesarAlertaPedidoPendiente:', error)
  }

  return resultado
}

/**
 * Procesa alerta de entregas próximas
 * Busca entregas programadas para hoy o mañana
 */
export async function procesarAlertaEntregaProxima(): Promise<AlertaResultado> {
  const resultado: AlertaResultado = {
    tipo: 'entrega_proxima',
    ejecutada: false,
    notificacionesEnviadas: 0,
    detalles: [],
  }

  try {
    const config = await db.alertaConfiguracion.findUnique({
      where: { tipo: 'entrega_proxima' },
    })

    if (!config || !config.activo) {
      resultado.detalles.push('Alerta de entregas próximas desactivada o no configurada')
      return resultado
    }

    // Buscar entregas programadas para hoy y mañana
    const hoy = new Date()
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    manana.setHours(23, 59, 59, 999)

    const entregasProximas = await db.entrega.findMany({
      where: {
        estado: { in: ['programado', 'en_camino'] },
        fecha_programada: {
          gte: hoy,
          lte: manana,
        },
      },
      include: {
        pedido: {
          include: {
            cliente: {
              select: { nombre: true, apellido: true, razon_social: true },
            },
          },
        },
        puntoEncuentro: true,
      },
    })

    if (entregasProximas.length === 0) {
      resultado.detalles.push('No hay entregas próximas')
      resultado.ejecutada = true
      return resultado
    }

    resultado.detalles.push(`${entregasProximas.length} entregas próximas encontradas`)

    // Enviar notificaciones
    const destinatarios: string[] = config.destinatarios
      ? JSON.parse(config.destinatarios)
      : []

    for (const dest of destinatarios) {
      const esEmail = dest.includes('@')
      const entregasList = entregasProximas
        .map(e => {
          const cliente = e.pedido.cliente.razon_social || `${e.pedido.cliente.nombre} ${e.pedido.cliente.apellido}`
          const ubicacion = e.puntoEncuentro?.nombre || e.direccion_alternativa || 'Sin ubicación'
          return `- Entrega #${e.id}: ${cliente} - ${ubicacion} - ${new Date(e.fecha_programada).toLocaleDateString('es-AR')}`
        })
        .join('\n')

      const mensaje = `🚚 ALERTA DE ENTREGAS PRÓXIMAS\n\n${entregasProximas.length} entregas para hoy/mañana:\n\n${entregasList}`

      const notifResult = await enviarNotificacion({
        tipo: esEmail ? 'email' : 'whatsapp',
        destinatario: dest,
        asunto: 'Alerta de Entregas Próximas - Pastas Orlando',
        mensaje,
      })

      if (notifResult.success) {
        resultado.notificacionesEnviadas++
      }
    }

    await db.alertaConfiguracion.update({
      where: { tipo: 'entrega_proxima' },
      data: { ultimo_envio: new Date() },
    })

    resultado.ejecutada = true
  } catch (error) {
    resultado.error = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en procesarAlertaEntregaProxima:', error)
  }

  return resultado
}

/**
 * Procesa alerta de producción atrasada
 * Busca producciones que están retrasadas respecto a la fecha planificada
 */
export async function procesarAlertaProduccionAtrasada(): Promise<AlertaResultado> {
  const resultado: AlertaResultado = {
    tipo: 'produccion_atrasada',
    ejecutada: false,
    notificacionesEnviadas: 0,
    detalles: [],
  }

  try {
    const config = await db.alertaConfiguracion.findUnique({
      where: { tipo: 'produccion_atrasada' },
    })

    if (!config || !config.activo) {
      resultado.detalles.push('Alerta de producción atrasada desactivada o no configurada')
      return resultado
    }

    // Buscar producciones en estado "en_proceso" con fecha_produccion anterior a hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Obtener estados de producción que indican "en proceso"
    const estadosEnProceso = await db.estadoGeneral.findMany({
      where: {
        entidad_aplicable: { contains: 'produccion' },
        nombre_estado: { in: ['en_proceso', 'pendiente', 'iniciado'] },
      },
    })
    const estadoIds = estadosEnProceso.map(e => e.id)

    const produccionesAtrasadas = await db.produccion.findMany({
      where: {
        id_estado: { in: estadoIds },
        fecha_produccion: { lt: hoy },
      },
      include: {
        receta: {
          select: { nombre: true },
        },
        estado: {
          select: { nombre_estado: true },
        },
      },
      orderBy: { fecha_produccion: 'asc' },
    })

    if (produccionesAtrasadas.length === 0) {
      resultado.detalles.push('No hay producciones atrasadas')
      resultado.ejecutada = true
      return resultado
    }

    resultado.detalles.push(`${produccionesAtrasadas.length} producciones atrasadas encontradas`)

    // Enviar notificaciones
    const destinatarios: string[] = config.destinatarios
      ? JSON.parse(config.destinatarios)
      : []

    for (const dest of destinatarios) {
      const esEmail = dest.includes('@')
      const prodList = produccionesAtrasadas
        .map(p => `- Producción #${p.id}: ${p.receta?.nombre || 'N/A'} - Planificada: ${new Date(p.fecha_produccion).toLocaleDateString('es-AR')} (${p.estado?.nombre_estado || 'N/A'})`)
        .join('\n')

      const mensaje = `🏭 ALERTA DE PRODUCCIÓN ATRASADA\n\n${produccionesAtrasadas.length} producciones atrasadas:\n\n${prodList}`

      const notifResult = await enviarNotificacion({
        tipo: esEmail ? 'email' : 'whatsapp',
        destinatario: dest,
        asunto: 'Alerta de Producción Atrasada - Pastas Orlando',
        mensaje,
      })

      if (notifResult.success) {
        resultado.notificacionesEnviadas++
      }
    }

    await db.alertaConfiguracion.update({
      where: { tipo: 'produccion_atrasada' },
      data: { ultimo_envio: new Date() },
    })

    resultado.ejecutada = true
  } catch (error) {
    resultado.error = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en procesarAlertaProduccionAtrasada:', error)
  }

  return resultado
}

/**
 * Ejecuta todas las alertas activas
 */
export async function procesarTodasLasAlertas(): Promise<AlertaResultado[]> {
  const resultados: AlertaResultado[] = []

  const stockResult = await procesarAlertaStockBajo()
  resultados.push(stockResult)

  const pedidoResult = await procesarAlertaPedidoPendiente()
  resultados.push(pedidoResult)

  const entregaResult = await procesarAlertaEntregaProxima()
  resultados.push(entregaResult)

  const prodResult = await procesarAlertaProduccionAtrasada()
  resultados.push(prodResult)

  return resultados
}
