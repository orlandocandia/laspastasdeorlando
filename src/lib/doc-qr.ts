/**
 * Utilidades para generar códigos QR de documentos (client-side).
 * Usa la librería `qrcode` (ya instalada) para generar un data URL PNG.
 */

import QRCode from 'qrcode'

export interface DocQrOptions {
  /** Tipo de documento: factura, orden_compra, orden_produccion, etc. */
  tipo: string
  /** ID de la entidad (venta, compra, produccion) */
  id: number
  /** Número de comprobante opcional para verificación */
  comprobante?: string | null
  /** URL base del sistema (ej: https://laspastasdeorlando.vercel.app). Si vacío usa NEXT_PUBLIC_APP_URL */
  urlBase?: string
}

/**
 * Construye el contenido del QR: una URL al documento en el sistema,
 * o un string de verificación si no hay URL base.
 */
export function buildDocQrContent({ tipo, id, comprobante, urlBase }: DocQrOptions): string {
  const base = urlBase || process.env.NEXT_PUBLIC_APP_URL || ''
  const comp = comprobante ? `?c=${encodeURIComponent(comprobante)}` : ''
  if (base) {
    const path = tipo === 'factura' ? `/admin/ventas/${id}`
      : tipo === 'orden_compra' ? `/admin/compras/${id}`
      : tipo === 'orden_produccion' ? `/admin/produccion/${id}`
      : `/admin/${tipo}/${id}`
    return `${base}${path}${comp}`
  }
  // Sin URL base: string de verificación
  return `${tipo.toUpperCase()}-${comprobante || id}`
}

/**
 * Genera un código QR como data URL (PNG base64).
 * Retorna null si la generación falla (el documento se genera sin QR).
 */
export async function generateDocQrDataUrl(options: DocQrOptions): Promise<string | null> {
  try {
    const content = buildDocQrContent(options)
    const dataUrl = await QRCode.toDataURL(content, {
      width: 120,
      margin: 1,
      color: {
        dark: '#5C3A21', // marrón
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
    return dataUrl
  } catch (err) {
    console.error('[doc-qr] Error generando QR:', err)
    return null
  }
}
