import { NextResponse } from 'next/server'
import { listClients, type CmClientRecord } from '@/lib/cocina-movil/clients'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'excel').toLowerCase()
  const { clients } = listClients({ page: 1, pageSize: 1000 })
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  if (format === 'excel') return exportExcel(clients, ts)
  if (format === 'pdf') return exportPdf(clients, ts)
  if (format === 'word') return exportWord(clients, ts)
  return NextResponse.json({ error: 'Formato no soportado.' }, { status: 400 })
}

async function exportExcel(items: CmClientRecord[], ts: string) {
  const XLSX = await import('xlsx')
  const data = items.map((c, i) => ({
    '#': i + 1, Nombre: c.firstName, Apellido: c.lastName, DNI: c.dni || '', Teléfono: c.phone || '',
    Email: c.email || '', Dirección: c.address || '', Ciudad: c.city || '',
    Notas: c.notes || '', Estado: c.isActive ? 'Activo' : 'Inactivo',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="clientes-${ts}.xlsx"` } })
}

async function exportWord(items: CmClientRecord[], ts: string) {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } = docx
  const headers = ['#', 'Nombre', 'Apellido', 'DNI', 'Teléfono', 'Email', 'Ciudad', 'Estado']
  const headerRow = new TableRow({ children: headers.map(t => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })], shading: { fill: '5C3A21' } })) })
  const rows = items.map((c, i) => new TableRow({ children: [String(i + 1), c.firstName, c.lastName, c.dni || '', c.phone || '', c.email || '', c.city || '', c.isActive ? 'Activo' : 'Inactivo'].map(t => new TableCell({ children: [new Paragraph(t)] })) }))
  const doc = new Document({ sections: [{ properties: {}, children: [
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cocina Móvil — Clientes', bold: true, color: '5C3A21' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Generado: ${new Date().toLocaleDateString('es-AR')} · Total: ${items.length}`, size: 18, color: '8A7E70' })] }),
    new Paragraph({ text: '' }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] }),
  ] }] })
  const buf = await Packer.toBuffer(doc)
  return new NextResponse(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="clientes-${ts}.docx"` } })
}

async function exportPdf(items: CmClientRecord[], ts: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pw = 297, ph = 210, m = 14
  doc.setFillColor(92, 58, 33); doc.rect(0, 0, pw, 25, 'F')
  doc.setTextColor(225, 173, 1); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('Cocina Móvil — Clientes', m, 12)
  doc.setTextColor(255, 248, 231); doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.text('Listado de Clientes', m, 19)
  let y = 32
  const colX = [m, m + 10, m + 40, m + 75, m + 105, m + 135, m + 180, m + 220]
  const headers = ['#', 'Nombre', 'Apellido', 'DNI', 'Teléfono', 'Email', 'Ciudad', 'Estado']
  doc.setFillColor(92, 58, 33); doc.rect(m, y, pw - 2 * m, 8, 'F')
  doc.setTextColor(255, 248, 231); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  for (let c = 0; c < headers.length; c++) doc.text(headers[c], colX[c] + 1, y + 5.5)
  y += 8; doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  items.forEach((c, i) => {
    if (y > ph - 20) { doc.addPage(); y = 20; doc.setFillColor(92, 58, 33); doc.rect(m, y, pw - 2 * m, 8, 'F'); doc.setTextColor(255, 248, 231); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); for (let j = 0; j < headers.length; j++) doc.text(headers[j], colX[j] + 1, y + 5.5); y += 8; doc.setFont('helvetica', 'normal'); doc.setFontSize(8) }
    if (i % 2 === 1) { doc.setFillColor(250, 243, 227); doc.rect(m, y, pw - 2 * m, 7, 'F') }
    const rowData = [String(i + 1), c.firstName, c.lastName, c.dni || '', c.phone || '', c.email || '', c.city || '', c.isActive ? 'Activo' : 'Inactivo']
    for (let j = 0; j < rowData.length; j++) doc.text(String(rowData[j]).substring(0, 35), colX[j] + 1, y + 5)
    y += 7
  })
  const buf = doc.output('arraybuffer')
  return new NextResponse(buf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="clientes-${ts}.pdf"` } })
}
