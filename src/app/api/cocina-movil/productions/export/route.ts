import { NextResponse } from 'next/server'
import { listProductions, type CmProductionRecord } from '@/lib/cocina-movil/productions'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'excel').toLowerCase()
  const search = url.searchParams.get('search') || undefined
  const placeId = url.searchParams.get('placeId') || null
  const statusParam = url.searchParams.get('status') || 'all'
  const { productions } = listProductions({ search, placeId, status: statusParam as 'all', page: 1, pageSize: 1000 })
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
  if (format === 'excel') return exportExcel(productions, ts)
  if (format === 'word') return exportWord(productions, ts)
  if (format === 'pdf') return exportPdf(productions, ts)
  return NextResponse.json({ error: 'Formato no soportado.' }, { status: 400 })
}

async function exportExcel(items: CmProductionRecord[], ts: string) {
  const XLSX = await import('xlsx')
  const data = items.map((p, i) => ({
    '#': i+1, Fecha: formatDate(p.createdAt), Receta: p.recipeTitle, Cocinero: p.cookName||'',
    Lugar: p.placeName, Cantidad: p.quantity, Costo: p.cost, Estado: p.status,
    Observaciones: p.observations||'',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{wch:5},{wch:20},{wch:30},{wch:18},{wch:18},{wch:10},{wch:12},{wch:12},{wch:30}]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Producciones')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="producciones-${ts}.xlsx"` } })
}

async function exportWord(items: CmProductionRecord[], ts: string) {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } = docx
  const headers = ['#', 'Fecha', 'Receta', 'Cocinero', 'Lugar', 'Cantidad', 'Costo', 'Estado']
  const headerRow = new TableRow({ children: headers.map(t => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })], shading: { fill: '5C3A21' } })) })
  const rows = items.map((p, i) => new TableRow({ children: [String(i+1), formatDate(p.createdAt), p.recipeTitle, p.cookName||'', p.placeName, String(p.quantity), `$${p.cost.toFixed(2)}`, p.status].map(t => new TableCell({ children: [new Paragraph(t)] })) }))
  const doc = new Document({ sections: [{ properties: {}, children: [
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cocina Móvil — Producciones', bold: true, color: '5C3A21' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Generado: ${formatDate(Date.now())} · Total: ${items.length}`, size: 18, color: '8A7E70' })] }),
    new Paragraph({ text: '' }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] }),
  ] }] })
  const buf = await Packer.toBuffer(doc)
  return new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="producciones-${ts}.docx"` } })
}

async function exportPdf(items: CmProductionRecord[], ts: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pw = 297, ph = 210, m = 14
  doc.setFillColor(92,58,33); doc.rect(0,0,pw,25,'F')
  doc.setTextColor(225,173,1); doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('Cocina Móvil — Producciones', m, 12)
  doc.setTextColor(255,248,231); doc.setFontSize(10); doc.setFont('helvetica','italic'); doc.text('Listado de Producciones', m, 19)
  doc.setTextColor(60,60,60); doc.setFontSize(9); doc.setFont('helvetica','normal')
  doc.text(`Generado: ${formatDate(Date.now())}`, 200, 12); doc.text(`Total: ${items.length}`, 200, 17)
  let y = 32
  const colX = [m, m+10, m+35, m+110, m+160, m+195, m+215, m+250]
  const headers = ['#', 'Fecha', 'Receta', 'Cocinero', 'Lugar', 'Cant.', 'Costo', 'Estado']
  doc.setFillColor(92,58,33); doc.rect(m, y, pw-2*m, 8, 'F')
  doc.setTextColor(255,248,231); doc.setFont('helvetica','bold'); doc.setFontSize(9)
  for (let c = 0; c < headers.length; c++) doc.text(headers[c], colX[c]+1, y+5.5)
  y += 8
  doc.setFont('helvetica','normal'); doc.setFontSize(8)
  items.forEach((p, i) => {
    if (y > ph-20) { doc.addPage(); y = 20; doc.setFillColor(92,58,33); doc.rect(m,y,pw-2*m,8,'F'); doc.setTextColor(255,248,231); doc.setFont('helvetica','bold'); doc.setFontSize(9); for (let c=0;c<headers.length;c++) doc.text(headers[c],colX[c]+1,y+5.5); y+=8; doc.setFont('helvetica','normal'); doc.setFontSize(8) }
    if (i%2===1) { doc.setFillColor(250,243,227); doc.rect(m,y,pw-2*m,7,'F') }
    doc.setDrawColor(230,218,194); doc.setLineWidth(0.1); doc.line(m,y+7,pw-m,y+7)
    doc.setTextColor(50,50,50)
    const rowData = [String(i+1), formatDate(p.createdAt), p.recipeTitle, p.cookName||'', p.placeName, String(p.quantity), `$${p.cost.toFixed(0)}`, p.status]
    for (let c = 0; c < rowData.length; c++) doc.text(String(rowData[c]).substring(0,45), colX[c]+1, y+5)
    y += 7
  })
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(138,126,112); doc.text('Pastas artesanales con sabor a tradición · Posadas, Misiones', m, ph-5); doc.text(`Página ${i} de ${pageCount}`, pw-m-20, ph-5) }
  const buf = doc.output('arraybuffer')
  return new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="producciones-${ts}.pdf"` } })
}

function formatDate(ts: number): string {
  const d = new Date(ts); const pad = (n: number) => String(n).padStart(2,'0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
}
