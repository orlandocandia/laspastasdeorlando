import { NextResponse } from 'next/server'
import { getPrinterSettings, updatePrinterSettings, type CmPrinterType, type CmTicketWidth, type CmLabelSize, type CmPrinterPort, type CmPrinterSettings } from '@/lib/cocina-movil/printer-settings'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ settings: getPrinterSettings() })
}

export async function PUT(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }

  const updates: Partial<CmPrinterSettings> = {}
  const validTypes: CmPrinterType[] = ['zebra', 'epson', 'generic']
  const validWidths: CmTicketWidth[] = ['80mm', '58mm']
  const validSizes: CmLabelSize[] = ['50x30', '70x40', '100x60']
  const validPorts: CmPrinterPort[] = ['usb', 'ip', 'bluetooth']

  if (validTypes.includes(body.printerType as CmPrinterType)) updates.printerType = body.printerType as CmPrinterType
  if (validWidths.includes(body.ticketWidth as CmTicketWidth)) updates.ticketWidth = body.ticketWidth as CmTicketWidth
  if (validSizes.includes(body.labelSize as CmLabelSize)) updates.labelSize = body.labelSize as CmLabelSize
  if (validPorts.includes(body.port as CmPrinterPort)) updates.port = body.port as CmPrinterPort
  if (typeof body.ipAddress === 'string') updates.ipAddress = body.ipAddress
  if (typeof body.copies === 'number') updates.copies = body.copies
  if (typeof body.logoEnabled === 'boolean') updates.logoEnabled = body.logoEnabled
  if (typeof body.logoUrl === 'string') updates.logoUrl = body.logoUrl
  if (typeof body.thankYouMessage === 'string') updates.thankYouMessage = body.thankYouMessage
  if (typeof body.footerText === 'string') updates.footerText = body.footerText

  const settings = updatePrinterSettings(updates)
  return NextResponse.json({ settings })
}
