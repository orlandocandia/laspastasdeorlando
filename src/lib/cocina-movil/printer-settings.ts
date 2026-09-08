/**
 * ============================================================
 * Cocina Móvil — Configuración de Impresoras Térmicas (demo)
 * ============================================================
 * Guarda la configuración de impresoras térmicas para tickets
 * y etiquetas. En demo: in-memory singleton.
 * ============================================================
 */

export type CmPrinterType = 'zebra' | 'epson' | 'generic'
export type CmTicketWidth = '80mm' | '58mm'
export type CmLabelSize = '50x30' | '70x40' | '100x60'
export type CmPrinterPort = 'usb' | 'ip' | 'bluetooth'

export interface CmPrinterSettings {
  printerType: CmPrinterType
  ticketWidth: CmTicketWidth
  labelSize: CmLabelSize
  port: CmPrinterPort
  ipAddress: string | null
  copies: number
  logoEnabled: boolean
  logoUrl: string | null
  thankYouMessage: string
  footerText: string
}

const DEFAULT_SETTINGS: CmPrinterSettings = {
  printerType: 'epson',
  ticketWidth: '80mm',
  labelSize: '50x30',
  port: 'usb',
  ipAddress: null,
  copies: 1,
  logoEnabled: false,
  logoUrl: null,
  thankYouMessage: '¡Gracias por su compra!',
  footerText: 'El Amigo de las Pastas · Cocina Móvil',
}

let currentSettings: CmPrinterSettings = { ...DEFAULT_SETTINGS }

export function getPrinterSettings(): CmPrinterSettings {
  return { ...currentSettings }
}

export function updatePrinterSettings(updates: Partial<CmPrinterSettings>): CmPrinterSettings {
  currentSettings = { ...currentSettings, ...updates }
  console.log('[CocinaMóvil-Printer] Settings updated:', currentSettings.printerType, currentSettings.ticketWidth)
  return { ...currentSettings }
}
