import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { db } from '@/lib/db'
import { sendMail } from '@/lib/smtp-transporter'
import { requireAuth } from '@/lib/auth-helpers'
import { registrarDocumentoGenerado, getDocumentoConfig } from '@/lib/config-documento'
import {
  FacturaDocument,
  type VentaDocData,
} from '@/components/print/VentasDocumentPDF'

// POST /api/documentos/enviar-pdf — Genera un PDF server-side y lo envía por email
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const { tipo, id, destinatario, asunto } = body

    if (!tipo || !id || !destinatario) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: tipo, id, destinatario' },
        { status: 400 }
      )
    }

    // Por ahora soportamos factura. Otros tipos se pueden agregar siguiendo el mismo patrón.
    if (tipo !== 'factura') {
      return NextResponse.json(
        { error: `Tipo "${tipo}" no soportado para envío por email aún. Solo: factura` },
        { status: 400 }
      )
    }

    // Fetch venta server-side
    const venta = await db.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, razon_social: true, numero_documento: true, tipo_persona: true },
        },
        vendedor: { select: { id: true, email: true, persona: { select: { nombre: true, apellido: true } } } },
        formaPago: true,
        estado: true,
        detalle: {
          include: {
            productoTerminado: { select: { id: true, codigo: true, nombre: true, precio_venta: true } },
          },
        },
      },
    })

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Mapear a VentaDocData
    const ventaData: VentaDocData = {
      id: venta.id,
      numero_comprobante: venta.numero_comprobante,
      fecha_venta: venta.fecha_venta.toISOString(),
      subtotal: venta.subtotal,
      iva: venta.iva,
      total: venta.total,
      cliente: {
        nombre: venta.cliente.nombre,
        apellido: venta.cliente.apellido,
        razon_social: venta.cliente.razon_social,
        numero_documento: venta.cliente.numero_documento,
        tipo_persona: venta.cliente.tipo_persona,
      },
      vendedor: venta.vendedor
        ? { persona: venta.vendedor.persona ? { nombre: venta.vendedor.persona.nombre, apellido: venta.vendedor.persona.apellido } : { nombre: '', apellido: '' } }
        : null,
      formaPago: venta.formaPago ? { nombre_forma: venta.formaPago.nombre_forma } : null,
      estado: venta.estado ? { nombre_estado: venta.estado.nombre_estado } : null,
      detalle: venta.detalle.map((d) => ({
        nombre: d.productoTerminado?.nombre || '-',
        codigo: d.productoTerminado?.codigo || null,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
      })),
    }

    // Generar PDF server-side
    const config = await getDocumentoConfig()
    const qrContent = config.mostrar_qr
      ? `${config.qr_url_base || process.env.NEXT_PUBLIC_APP_URL || ''}/admin/ventas/${venta.id}${venta.numero_comprobante ? `?c=${encodeURIComponent(venta.numero_comprobante)}` : ''}`
      : null

    const element = React.createElement(FacturaDocument, { venta: ventaData, qrContent: qrContent || undefined } as any)
    const buffer = await renderToBuffer(element as React.ReactElement<DocumentProps>)
    const pdfBytes = Buffer.from(buffer)

    // Construir email HTML
    const comprobante = venta.numero_comprobante || `V-${String(venta.id).padStart(6, '0')}`
    const clienteNombre = venta.cliente.razon_social || `${venta.cliente.nombre} ${venta.cliente.apellido}`
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="font-family: Arial, sans-serif; background:#FFF8E7; margin:0; padding:20px;">
  <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#5C3A21; padding:24px; text-align:center;">
      <h1 style="color:#E1AD01; margin:0; font-size:24px;">${config.empresa_nombre}</h1>
      <p style="color:#FFF8E7; margin:4px 0 0;">Factura ${comprobante}</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#5C3A21; font-size:16px;">Estimado/a <strong>${clienteNombre}</strong>,</p>
      <p style="color:#333; line-height:1.6;">
        Adjuntamos la factura <strong>${comprobante}</strong> correspondiente a su compra.
        El documento se encuentra en formato PDF adjunto a este correo.
      </p>
      <div style="background:#F3F4F6; border-radius:6px; padding:16px; margin:16px 0;">
        <p style="margin:0; color:#6B7280; font-size:13px;">Total: <strong style="color:#5C3A21;">${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(venta.total)}</strong></p>
        <p style="margin:4px 0 0; color:#6B7280; font-size:13px;">Fecha: ${new Date(venta.fecha_venta).toLocaleDateString('es-AR')}</p>
      </div>
      <p style="color:#333; line-height:1.6; font-size:13px;">
        Si tiene alguna consulta sobre este documento, no dude en contactarnos respondiendo este correo.
      </p>
      <p style="color:#6B7280; font-size:12px; margin-top:24px;">${config.footer_texto}</p>
    </div>
    <div style="background:#F3F4F6; padding:16px; text-align:center; color:#6B7280; font-size:11px;">
      ${config.empresa_nombre} — ${config.empresa_direccion} — Tel: ${config.empresa_telefono} — CUIT: ${config.empresa_cuit}
    </div>
  </div>
</body>
</html>`

    const emailSubject = asunto || `Factura ${comprobante} — ${config.empresa_nombre}`

    // Enviar email con PDF adjunto
    await sendMail({
      to: destinatario,
      subject: emailSubject,
      html,
      text: `Estimado/a ${clienteNombre}, adjuntamos la factura ${comprobante}. Total: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(venta.total)}.`,
      attachments: [
        {
          filename: `factura-${comprobante}.pdf`,
          content: pdfBytes,
          contentType: 'application/pdf',
        },
      ],
    })

    // Registrar en historial
    await registrarDocumentoGenerado({
      tipo: 'factura',
      entidad_id: venta.id,
      entidad_tipo: 'venta',
      formato: 'pdf',
      generado_por: auth.session?.user?.id ? parseInt(auth.session.user.id) : null,
      email_enviado: true,
      destinatario,
      metadata: { comprobante, total: venta.total },
    })

    return NextResponse.json({
      ok: true,
      mensaje: `Factura ${comprobante} enviada a ${destinatario}`,
    })
  } catch (error) {
    console.error('Error al enviar documento por email:', error)
    const msg = error instanceof Error ? error.message : 'Error al enviar el documento'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
