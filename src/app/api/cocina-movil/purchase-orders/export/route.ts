import { NextResponse } from 'next/server'
import { listPurchaseOrders, type CmPurchaseOrderRecord } from '@/lib/cocina-movil/purchase-orders'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'excel').toLowerCase()
  const { orders } = listPurchaseOrders({ page: 1, pageSize: 1000 })
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  if (format === 'excel') return exportExcel(orders, ts)
  if (format === 'pdf') return exportPdf(orders, ts)
  if (format === 'word') return exportWord(orders, ts)
  return NextResponse.json({ error: 'Formato no soportado.' }, { status: 400 })
}

function buildRows(orders: CmPurchaseOrderRecord[]) {
  return orders.map((o, i) => ({
    '#': i + 1,
    'N° Pedido': o.orderNumber,
    'Proveedor': o.supplierName,
    'Fecha': new Date(o.orderDate).toLocaleDateString('es-AR'),
    'Entrega Estimada': o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('es-AR') : '—',
    'Items': o.items.length,
    'Total': o.total,
    'Estado': o.status,
    'Compra': o.purchaseId || '—',
  }))
}

async function exportExcel(orders: CmPurchaseOrderRecord[], ts: string) {
  const XLSX = await import('xlsx')
  const data = buildRows(orders)
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos a Proveedores')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="pedidos-proveedores-${ts}.xlsx"` },
  })
}

async function exportPdf(orders: CmPurchaseOrderRecord[], ts: string) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const data = buildRows(orders)
  let y = 810
  page.drawText('Pedidos a Proveedores', { x: 40, y, size: 16, font: bold, color: rgb(0.36, 0.23, 0.13) })
  y -= 30
  const headers = ['#', 'N°', 'Proveedor', 'Fecha', 'Items', 'Total', 'Estado']
  const widths = [20, 60, 120, 60, 30, 60, 50]
  let x = 40
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], { x, y, size: 9, font: bold, color: rgb(0.36, 0.23, 0.13) })
    x += widths[i]
  }
  y -= 15
  for (const row of data) {
    if (y < 50) { doc.addPage([595, 842]); y = 810 }
    x = 40
    const cells = [String(row['#']), row['N° Pedido'], row['Proveedor'].substring(0, 20), row['Fecha'], String(row['Items']), `$${row['Total']}`, row['Estado']]
    for (let i = 0; i < cells.length; i++) {
      page.drawText(cells[i], { x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) })
      x += widths[i]
    }
    y -= 14
  }
  const buf = await doc.save()
  return new NextResponse(buf, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="pedidos-proveedores-${ts}.pdf"` },
  })
}

async function exportWord(orders: CmPurchaseOrderRecord[], ts: string) {
  const data = buildRows(orders)
  let html = '<html><head><meta charset="utf-8"></head><body>'
  html += '<h1>Pedidos a Proveedores</h1>'
  html += '<table border="1" cellpadding="5" style="border-collapse:collapse;font-family:Arial;font-size:11px">'
  const headers = ['#', 'N° Pedido', 'Proveedor', 'Fecha', 'Entrega Estimada', 'Items', 'Total', 'Estado', 'Compra']
  html += '<tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr>'
  for (const row of data) {
    html += '<tr>'
    for (const h of headers) {
      const val = (row as Record<string, unknown>)[h]
      html += `<td>${val ?? '—'}</td>`
    }
    html += '</tr>'
  }
  html += '</table></body></html>'
  return new NextResponse(html, {
    headers: { 'Content-Type': 'application/vnd.ms-word', 'Content-Disposition': `attachment; filename="pedidos-proveedores-${ts}.doc"` },
  })
}
