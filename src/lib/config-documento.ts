/**
 * Helper server-side para obtener la configuración de documentos (PDFs).
 * Lee de la tabla ConfigDocumento (singleton id=1) con fallback a defaults.
 */
import { db } from '@/lib/db'

export interface ConfigDocumentoData {
  empresa_nombre: string
  empresa_direccion: string
  empresa_telefono: string
  empresa_email: string
  empresa_cuit: string
  empresa_condicion: string
  empresa_inicio_act: string
  logo_url: string | null
  footer_texto: string
  mostrar_qr: boolean
  qr_url_base: string
  texto_condiciones: string
  color_acento: string
}

const DEFAULTS: ConfigDocumentoData = {
  empresa_nombre: 'Pastas Orlando',
  empresa_direccion: 'Posadas, Misiones',
  empresa_telefono: '3754-419324',
  empresa_email: 'laspastasdeorlando@gmail.com',
  empresa_cuit: '20-12345678-9',
  empresa_condicion: 'Responsable Inscripto',
  empresa_inicio_act: '01/2018',
  logo_url: null,
  footer_texto: 'Documento no fiscal — Para uso interno',
  mostrar_qr: true,
  qr_url_base: '',
  texto_condiciones: 'La mercadería debe entregarse en condiciones óptimas. Cualquier diferencia debe notificarse dentro de las 48 hs.',
  color_acento: '#E1AD01',
}

/**
 * Obtiene la configuración de documentos desde la BD.
 * Si no existe o hay error, retorna los valores por defecto.
 */
export async function getDocumentoConfig(): Promise<ConfigDocumentoData> {
  try {
    const row = await db.configDocumento.findUnique({ where: { id: 1 } })
    if (!row) return DEFAULTS
    return {
      empresa_nombre: row.empresa_nombre || DEFAULTS.empresa_nombre,
      empresa_direccion: row.empresa_direccion || DEFAULTS.empresa_direccion,
      empresa_telefono: row.empresa_telefono || DEFAULTS.empresa_telefono,
      empresa_email: row.empresa_email || DEFAULTS.empresa_email,
      empresa_cuit: row.empresa_cuit || DEFAULTS.empresa_cuit,
      empresa_condicion: row.empresa_condicion || DEFAULTS.empresa_condicion,
      empresa_inicio_act: row.empresa_inicio_act || DEFAULTS.empresa_inicio_act,
      logo_url: row.logo_url,
      footer_texto: row.footer_texto || DEFAULTS.footer_texto,
      mostrar_qr: row.mostrar_qr,
      qr_url_base: row.qr_url_base || '',
      texto_condiciones: row.texto_condiciones || DEFAULTS.texto_condiciones,
      color_acento: row.color_acento || DEFAULTS.color_acento,
    }
  } catch (err) {
    console.error('[config-documento] Error leyendo config:', err)
    return DEFAULTS
  }
}

/**
 * Registra un documento generado en el historial.
 */
export async function registrarDocumentoGenerado(params: {
  tipo: string
  entidad_id: number
  entidad_tipo: string
  formato?: string
  generado_por?: number | null
  email_enviado?: boolean
  destinatario?: string | null
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  try {
    await db.documentoGenerado.create({
      data: {
        tipo: params.tipo,
        entidad_id: params.entidad_id,
        entidad_tipo: params.entidad_tipo,
        formato: params.formato || 'pdf',
        generado_por: params.generado_por ?? null,
        email_enviado: params.email_enviado ?? false,
        destinatario: params.destinatario ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
  } catch (err) {
    console.error('[config-documento] Error registrando documento generado:', err)
  }
}
