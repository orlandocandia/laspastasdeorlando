import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDocumentoConfig } from '@/lib/config-documento'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/config-documentos — Obtener configuración (público para que los PDFs client-side la lean)
export async function GET() {
  const config = await getDocumentoConfig()
  return NextResponse.json(config)
}

// PUT /api/config-documentos — Actualizar configuración (requiere auth)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const {
      empresa_nombre,
      empresa_direccion,
      empresa_telefono,
      empresa_email,
      empresa_cuit,
      empresa_condicion,
      empresa_inicio_act,
      logo_url,
      footer_texto,
      mostrar_qr,
      qr_url_base,
      texto_condiciones,
      color_acento,
    } = body

    // Upsert (siempre id=1)
    const config = await db.configDocumento.upsert({
      where: { id: 1 },
      update: {
        ...(empresa_nombre !== undefined ? { empresa_nombre } : {}),
        ...(empresa_direccion !== undefined ? { empresa_direccion } : {}),
        ...(empresa_telefono !== undefined ? { empresa_telefono } : {}),
        ...(empresa_email !== undefined ? { empresa_email } : {}),
        ...(empresa_cuit !== undefined ? { empresa_cuit } : {}),
        ...(empresa_condicion !== undefined ? { empresa_condicion } : {}),
        ...(empresa_inicio_act !== undefined ? { empresa_inicio_act } : {}),
        ...(logo_url !== undefined ? { logo_url: logo_url || null } : {}),
        ...(footer_texto !== undefined ? { footer_texto } : {}),
        ...(mostrar_qr !== undefined ? { mostrar_qr } : {}),
        ...(qr_url_base !== undefined ? { qr_url_base } : {}),
        ...(texto_condiciones !== undefined ? { texto_condiciones } : {}),
        ...(color_acento !== undefined ? { color_acento } : {}),
      },
      create: {
        id: 1,
        empresa_nombre,
        empresa_direccion,
        empresa_telefono,
        empresa_email,
        empresa_cuit,
        empresa_condicion,
        empresa_inicio_act,
        logo_url,
        footer_texto,
        mostrar_qr,
        qr_url_base,
        texto_condiciones,
        color_acento,
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error al actualizar configuración de documentos:', error)
    return NextResponse.json({ error: 'Error al guardar la configuración' }, { status: 500 })
  }
}
