import { NextResponse } from 'next/server'
import { listClientOrders, type CmClientOrderRecord } from '@/lib/cocina-movil/client-orders'
import { requireAdmin } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'excel').toLowerCase()
  const { orders } = listClientOrders({ page: 1, pageSize: 1000 })
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  if (format === 'excel') return exportExcel(orders, ts)
  if (format === 'pdf') return exportPdf(orders, ts)
  if (format === 'word') return exportWord(orders, ts)
  return NextResponse.json({ error: 'Formato no soportado.' }, { status: 400 })
}

function formatDate(ts: number): string {
  const d = new Date(ts); const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

async function exportExcel(orders: CmClientOrderRecord[], ts: string) {
  const XLSX = await import('xlsx')
  const data = orders.map((o, i) => ({
    '#': i + 1, 'N° Pedido': o.orderNumber, Cliente: o.clientName || '', Teléfono: o.clientPhone || '',
    Fecha: formatDate(o.orderDate), Entrega: o.expectedDeliveryDate ? formatDate(o.expectedDeliveryDate) : '—',
    Items: o.items.length, Total: o.total, Estado: o.status, Venta: o.saleId || '—',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos de Clientes')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="pedidos-clientes-${ts}.xlsx"` } })
}

async function exportWord(orders: CmClientOrderRecord[], ts: string) {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } = docx
  const headers = ['#', 'N° Pedido', 'Cliente', 'Fecha', 'Entrega', 'Items', 'Total', 'Estado', 'Venta']
  const headerRow = new TableRow({ children: headers.map(t => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })], shading: { fill: '5C3A21' } })) })
  const rows = orders.map((o, i) => new TableRow({ children: [String(i + 1), o.orderNumber, o.clientName || '', formatDate(o.orderDate), o.expectedDeliveryDate ? formatDate(o.expectedDeliveryDate) : '—', String(o.items.length), `$${o.total.toFixed(0)}`, o.status, o.saleId || '—'].map(t => new TableCell({ children: [new Paragraph(t)] })) }))
  const doc = new Document({ sections: [{ properties: {}, children: [
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cocina Móvil — Pedidos de Clientes', bold: true, color: '5C3A21' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Generado: ${formatDate(Date.now())} · Total: ${orders.length}`, size: 18, color: '8A7E70' })] }),
    new Paragraph({ text: '' }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] }),
  ] }] })
  const buf = await Packer.toBuffer(doc)
  return new NextResponse(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="pedidos-clientes-${ts}.docx"` } })
}

async function exportPdf(orders: CmClientOrderRecord[], ts: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pw = 297, ph = 210, m = 14
  doc.setFillColor(92, 58, 33); doc.rect(0, 0, pw, 25, 'F')
  doc.setTextColor(225, 173, 1); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('Cocina Móvil — Pedidos de Clientes', m, 12)
  doc.setTextColor(255, 248, 231); doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.text('Listado de Pedidos de Clientes', m, 19)
  doc.setTextColor(60, 60, 60); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${formatDate(Date.now())}`, 200, 12); doc.text(`Total: ${orders.length}`, 200, 17)
  let y = 32
  const colX = [m, m + 10, m + 30, m + 100, m + 140, m + 170, m + 200, m + 230, m + 260]
  const headers = ['#', 'N° Pedido', 'Cliente', 'Fecha', 'Entrega', 'Items', 'Total', 'Estado', 'Venta']
  doc.setFillColor(92, 58, 33); doc.rect(m, y, pw - 2 * m, 8, 'F')
  doc.setTextColor(255, 248, 231); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  for (let c = 0; c < headers.length; c++) doc.text(headers[c], colX[c] + 1, y + 5.5)
  y += 8; doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  orders.forEach((o, i) => {
    if (y > ph - 20) { doc.addPage(); y = 20; doc.setFillColor(92, 58, 33); doc.rect(m, y, pw - 2 * m, 8, 'F'); doc.setTextColor(255, 248, 231); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); for (let c = 0; c < headers.length; c++) doc.text(headers[c], colX[c] + 1, y + 5.5); y += 8; doc.setFont('helvetica', 'normal'); doc.setFontSize(8) }
    if (i % 2 === 1) { doc.setFillColor(250, 243, 227); doc.rect(m, y, pw - 2 * m, 7, 'F') }
    doc.setDrawColor(230, 218, 194); doc.setLineWidth(0.1); doc.line(m, y + 7, pw - m, y + 7)
    doc.setTextColor(50, 50, 50)
    const rowData = [String(i + 1), o.orderNumber, o.clientName || '', formatDate(o.orderDate), o.expectedDeliveryDate ? formatDate(o.expectedDeliveryDate) : '—', String(o.items.length), `$${o.total.toFixed(0)}`, o.status, o.saleId || '—']
    for (let c = 0; c < rowData.length; c++) doc.text(String(rowData[c]).substring(0, 30), colX[c] + 1, y + 5)
    y += 7
  })
  const buf = doc.output('arraybuffer')
  return new NextResponse(buf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="pedidos-clientes-${ts}.pdf"` } })
}
