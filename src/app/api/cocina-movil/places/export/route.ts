import { NextResponse } from 'next/server'
import { listPlaces, type CmPlaceRecord } from '@/lib/cocina-movil/places'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'excel').toLowerCase()
  const search = url.searchParams.get('search') || undefined
  const statusParam = url.searchParams.get('isActive') || 'all'
  const isActive = statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'
  const { places } = listPlaces({ search, isActive, page: 1, pageSize: 1000 })
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

  if (format === 'excel') return exportExcel(places, timestamp)
  if (format === 'word') return exportWord(places, timestamp)
  if (format === 'pdf') return exportPdf(places, timestamp)
  return NextResponse.json({ error: 'Formato no soportado.' }, { status: 400 })
}

async function exportExcel(places: CmPlaceRecord[], timestamp: string) {
  const XLSX = await import('xlsx')
  const data = places.map((p, i) => ({
    '#': i + 1, Nombre: p.name, Descripción: p.description || '',
    Responsable: p.contactName || '', Teléfono: p.contactPhone || '', Email: p.contactEmail || '',
    Dirección: p.address || '', País: p.country || '', Provincia: p.province || '',
    Departamento: p.department || '', Municipio: p.municipality || '', Ubicación: p.location || '',
    Propio: p.isOwned ? 'Sí' : 'No', Alquiler: p.rentCost || '', Servicios: p.utilityCost || '',
    'Otros Costos': p.otherFixedCosts || '', Estado: p.isActive ? 'Activo' : 'Inactivo',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{wch:5},{wch:25},{wch:30},{wch:20},{wch:15},{wch:30},{wch:25},{wch:15},{wch:15},{wch:15},{wch:15},{wch:18},{wch:8},{wch:12},{wch:12},{wch:12},{wch:12}]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Lugares')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="lugares-cocina-movil-${timestamp}.xlsx"` } })
}

async function exportWord(places: CmPlaceRecord[], timestamp: string) {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } = docx
  const headers = ['#', 'Nombre', 'Dirección', 'Responsable', 'Estado']
  const headerRow = new TableRow({ children: headers.map(t => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })], shading: { fill: '5C3A21' } })) })
  const rows = places.map((p, i) => new TableRow({ children: [String(i+1), p.name, p.address || '', p.contactName || '', p.isActive ? 'Activo' : 'Inactivo'].map(t => new TableCell({ children: [new Paragraph(t)] })) }))
  const doc = new Document({ sections: [{ properties: {}, children: [
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cocina Móvil — Lugares', bold: true, color: '5C3A21' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Generado: ${formatDate(Date.now())} · Total: ${places.length}`, size: 18, color: '8A7E70' })] }),
    new Paragraph({ text: '' }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] }),
  ] }] })
  const buf = await Packer.toBuffer(doc)
  return new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="lugares-cocina-movil-${timestamp}.docx"` } })
}

async function exportPdf(places: CmPlaceRecord[], timestamp: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pw = 297, ph = 210, m = 14
  doc.setFillColor(92,58,33); doc.rect(0,0,pw,25,'F')
  doc.setTextColor(225,173,1); doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('Cocina Móvil — Lugares', m, 12)
  doc.setTextColor(255,248,231); doc.setFontSize(10); doc.setFont('helvetica','italic'); doc.text('Listado de Lugares', m, 19)
  doc.setTextColor(60,60,60); doc.setFontSize(9); doc.setFont('helvetica','normal')
  doc.text(`Generado: ${formatDate(Date.now())}`, 200, 12); doc.text(`Total: ${places.length} lugares`, 200, 17)
  let y = 32
  const colX = [m, m+10, m+55, m+120, m+165, m+210, m+245]
  const headers = ['#', 'Nombre', 'Dirección', 'Responsable', 'Teléfono', 'Estado']
  doc.setFillColor(92,58,33); doc.rect(m, y, pw-2*m, 8, 'F')
  doc.setTextColor(255,248,231); doc.setFont('helvetica','bold'); doc.setFontSize(9)
  for (let c = 0; c < headers.length; c++) doc.text(headers[c], colX[c]+1, y+5.5)
  y += 8
  doc.setFont('helvetica','normal'); doc.setFontSize(8)
  places.forEach((p, i) => {
    if (y > ph-20) { doc.addPage(); y = 20; doc.setFillColor(92,58,33); doc.rect(m,y,pw-2*m,8,'F'); doc.setTextColor(255,248,231); doc.setFont('helvetica','bold'); doc.setFontSize(9); for (let c=0;c<headers.length;c++) doc.text(headers[c],colX[c]+1,y+5.5); y+=8; doc.setFont('helvetica','normal'); doc.setFontSize(8) }
    if (i%2===1) { doc.setFillColor(250,243,227); doc.rect(m,y,pw-2*m,7,'F') }
    doc.setDrawColor(230,218,194); doc.setLineWidth(0.1); doc.line(m,y+7,pw-m,y+7)
    doc.setTextColor(50,50,50)
    const rowData = [String(i+1), p.name, p.address||'', p.contactName||'', p.contactPhone||'', p.isActive?'Activo':'Inactivo']
    for (let c = 0; c < rowData.length; c++) doc.text(String(rowData[c]).substring(0, 40), colX[c]+1, y+5)
    y += 7
  })
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(138,126,112); doc.text('Pastas artesanales con sabor a tradición · Posadas, Misiones', m, ph-5); doc.text(`Página ${i} de ${pageCount}`, pw-m-20, ph-5) }
  const buf = doc.output('arraybuffer')
  return new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="lugares-cocina-movil-${timestamp}.pdf"` } })
}

function formatDate(ts: number): string {
  const d = new Date(ts); const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
