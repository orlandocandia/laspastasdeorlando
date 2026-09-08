/**
 * POST /api/cocina-movil/print/ticket
 * Body: { saleId: string }
 * Returns: { ticket: string (ESC/POS or HTML), format: string, settings: object }
 *
 * Generates a thermal ticket for a sale. In browser, the frontend
 * uses the returned data to open a print window.
 */
import { NextResponse } from 'next/server'
import { getSaleById } from '@/lib/cocina-movil/sales'
import { getPrinterSettings } from '@/lib/cocina-movil/printer-settings'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: { saleId?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const saleId = body.saleId
  if (typeof saleId !== 'string' || !saleId) return NextResponse.json({ error: 'saleId es obligatorio.' }, { status: 400 })

  const sale = getSaleById(saleId)
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada.' }, { status: 404 })

  const settings = getPrinterSettings()
  const width = settings.ticketWidth === '80mm' ? 42 : 32 // chars per line approx

  // Generate ESC/POS-like text ticket (also works as plain text for display)
  const lines: string[] = []
  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2))
    return ' '.repeat(pad) + text
  }
  const line = '─'.repeat(width)

  // Header
  if (settings.logoEnabled && settings.logoUrl) {
    lines.push(center('[LOGO]'))
  }
  lines.push(center('EL AMIGO DE LAS PASTAS'))
  lines.push(center('Cocina Móvil'))
  lines.push(center('Posadas, Misiones'))
  lines.push(line)
  lines.push(center('TICKET DE VENTA'))
  lines.push(`Ticket: ${sale.ticketNumber}`)
  lines.push(`Fecha: ${formatDateTime(sale.saleDate)}`)
  if (sale.clientName) lines.push(`Cliente: ${sale.clientName}`)
  lines.push(`Lugar: ${sale.placeName}`)
  lines.push(line)

  // Items
  lines.push('DESCRIPCION')
  lines.push(`${sale.recipeTitle}`)
  lines.push(`  ${sale.quantity} x $${sale.unitPrice.toFixed(2)} = $${sale.totalPrice.toFixed(2)}`)
  lines.push(line)

  // Totals
  const iva = sale.totalPrice * 0.21
  const subtotal = sale.totalPrice - iva
  lines.push(`Subtotal:          $${subtotal.toFixed(2)}`)
  lines.push(`IVA (21%):         $${iva.toFixed(2)}`)
  lines.push(`TOTAL:             $${sale.totalPrice.toFixed(2)}`)
  lines.push(line)

  // Payment
  lines.push(`Forma de pago: Efectivo`)
  lines.push(line)

  // Footer
  lines.push(center(settings.thankYouMessage))
  lines.push(center(settings.footerText))
  lines.push('')
  lines.push(center('Pastas artesanales con'))
  lines.push(center('sabor a tradicion'))
  lines.push('')
  lines.push(line)

  const ticket = lines.join('\n')

  return NextResponse.json({
    ticket,
    format: settings.printerType,
    width: settings.ticketWidth,
    sale: {
      ticketNumber: sale.ticketNumber,
      recipeTitle: sale.recipeTitle,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      totalPrice: sale.totalPrice,
      clientName: sale.clientName,
      saleDate: sale.saleDate,
    },
    settings,
  })
}

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
