'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ConfigDocumentoData } from '@/lib/config-documento'

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
 * Hook client-side para obtener la configuración de documentos.
 * Cachea en memoria después de la primera carga.
 */
let cachedConfig: ConfigDocumentoData | null = null

export function useConfigDocumento() {
  const [config, setConfig] = useState<ConfigDocumentoData>(cachedConfig || DEFAULTS)
  const [loading, setLoading] = useState(!cachedConfig)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config-documentos')
      if (res.ok) {
        const data: ConfigDocumentoData = await res.json()
        cachedConfig = data
        setConfig(data)
      }
    } catch (err) {
      console.error('[useConfigDocumento] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!cachedConfig) fetchConfig()
  }, [fetchConfig])

  return { config, loading, refetch: fetchConfig }
}

/**
 * Genera un código QR como data URL si la config lo permite.
 * Usa el urlBase de la config o NEXT_PUBLIC_APP_URL.
 */
export async function maybeGenerateQr(
  config: ConfigDocumentoData,
  opts: { tipo: string; id: number; comprobante?: string | null }
): Promise<string | null> {
  if (!config.mostrar_qr) return null
  try {
    const QRCode = (await import('qrcode')).default
    const base = config.qr_url_base || ''
    const comp = opts.comprobante ? `?c=${encodeURIComponent(opts.comprobante)}` : ''
    const path = opts.tipo === 'factura' ? `/admin/ventas/${opts.id}`
      : opts.tipo === 'orden_compra' ? `/admin/compras/${opts.id}`
      : opts.tipo === 'orden_produccion' ? `/admin/produccion/${opts.id}`
      : `/admin/${opts.tipo}/${opts.id}`
    const content = base ? `${base}${path}${comp}` : `${opts.tipo.toUpperCase()}-${opts.comprobante || opts.id}`
    return await QRCode.toDataURL(content, {
      width: 120, margin: 1,
      color: { dark: '#5C3A21', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    })
  } catch (err) {
    console.error('[maybeGenerateQr] Error:', err)
    return null
  }
}
