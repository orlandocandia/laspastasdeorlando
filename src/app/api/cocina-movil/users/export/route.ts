/**
 * ============================================================
 * API — Exportar usuarios de la Cocina Móvil
 * ============================================================
 * GET /api/cocina-movil/users/export?format=pdf|word|excel&search=&role=&isActive=
 *
 * Genera un archivo descargable con la lista de usuarios.
 * Formatos soportados:
 *  - pdf:   usando jsPDF
 *  - word:  usando docx
 *  - excel: usando xlsx (SheetJS)
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { listUsers, type CmUserRecord } from '@/lib/cocina-movil/users'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'excel').toLowerCase()
  const search = url.searchParams.get('search') || undefined
  const roleParam = url.searchParams.get('role') || 'all'
  const statusParam = url.searchParams.get('isActive') || 'all'

  const role = ['admin', 'cocinero', 'supervisor'].includes(roleParam) ? roleParam : 'all'
  const isActive = statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'

  const { users } = listUsers({
    search,
    role: role as 'all',
    isActive: isActive as 'all',
    page: 1,
    pageSize: 1000,
  })

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

  if (format === 'excel') {
    return exportExcel(users, timestamp)
  }
  if (format === 'word') {
    return exportWord(users, timestamp)
  }
  if (format === 'pdf') {
    return exportPdf(users, timestamp)
  }
  return NextResponse.json({ error: 'Formato no soportado. Usar: pdf, word, o excel.' }, { status: 400 })
}

// ----- Excel -----
async function exportExcel(users: CmUserRecord[], timestamp: string) {
  const XLSX = await import('xlsx')
  const data = users.map((u, i) => ({
    '#': i + 1,
    Nombre: u.name,
    Email: u.email,
    Rol: u.role,
    Estado: u.isActive ? 'Activo' : 'Inactivo',
    'Último Acceso': u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Nunca',
    'Creado': formatDate(u.createdAt),
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  // Anchos de columna
  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 22 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="usuarios-cocina-movil-${timestamp}.xlsx"`,
    },
  })
}

// ----- Word -----
async function exportWord(users: CmUserRecord[], timestamp: string) {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } = docx

  const headerCells = ['#', 'Nombre', 'Email', 'Rol', 'Estado', 'Último Acceso'].map(
    (text) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        shading: { fill: '5C3A21' },
      })
  )
  const headerRow = new TableRow({ children: headerCells })

  const dataRows = users.map(
    (u, i) =>
      new TableRow({
        children: [
          String(i + 1),
          u.name,
          u.email,
          u.role,
          u.isActive ? 'Activo' : 'Inactivo',
          u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Nunca',
        ].map((text) => new TableCell({ children: [new Paragraph(text)] })),
      })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Cocina Móvil — El Amigo de las Pastas', bold: true, color: '5C3A21' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Listado de Usuarios', italics: true, color: '8A7E70' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Generado: ${formatDate(Date.now())} · Total: ${users.length} usuarios`,
                size: 18,
                color: '8A7E70',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  })

  const buf = await Packer.toBuffer(doc)
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="usuarios-cocina-movil-${timestamp}.docx"`,
    },
  })
}

// ----- PDF -----
async function exportPdf(users: CmUserRecord[], timestamp: string) {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = 297
  const pageHeight = 210
  const margin = 14
  let y = 0

  // Header band
  doc.setFillColor(92, 58, 33) // marron
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(225, 173, 1) // mostaza
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Cocina Movil - El Amigo de las Pastas', margin, 12)
  doc.setTextColor(255, 248, 231) // crema
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text('Listado de Usuarios', margin, 19)

  // Info
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${formatDate(Date.now())}`, 200, 12)
  doc.text(`Total: ${users.length} usuarios`, 200, 17)

  y = 32

  // Table header
  const colX = [margin, margin + 10, margin + 50, margin + 120, margin + 145, margin + 170, margin + 210]
  const colW = [10, 40, 70, 25, 25, 40, 30]
  const headers = ['#', 'Nombre', 'Email', 'Rol', 'Estado', 'Ultimo Acceso']

  doc.setFillColor(92, 58, 33)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 248, 231)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(headers[0], colX[0] + 1, y + 5.5)
  doc.text(headers[1], colX[1] + 1, y + 5.5)
  doc.text(headers[2], colX[2] + 1, y + 5.5)
  doc.text(headers[3], colX[3] + 1, y + 5.5)
  doc.text(headers[4], colX[4] + 1, y + 5.5)
  doc.text(headers[5], colX[5] + 1, y + 5.5)
  y += 8

  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const rowHeight = 7

  users.forEach((u, i) => {
    // Check for page break
    if (y > pageHeight - 20) {
      doc.addPage()
      y = 20
      // Repeat header on new page
      doc.setFillColor(92, 58, 33)
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
      doc.setTextColor(255, 248, 231)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(headers[0], colX[0] + 1, y + 5.5)
      doc.text(headers[1], colX[1] + 1, y + 5.5)
      doc.text(headers[2], colX[2] + 1, y + 5.5)
      doc.text(headers[3], colX[3] + 1, y + 5.5)
      doc.text(headers[4], colX[4] + 1, y + 5.5)
      doc.text(headers[5], colX[5] + 1, y + 5.5)
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
    }

    // Alternate row background
    if (i % 2 === 1) {
      doc.setFillColor(250, 243, 227)
      doc.rect(margin, y, pageWidth - 2 * margin, rowHeight, 'F')
    }

    // Row border
    doc.setDrawColor(230, 218, 194)
    doc.setLineWidth(0.1)
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight)

    doc.setTextColor(50, 50, 50)
    doc.text(String(i + 1), colX[0] + 1, y + 5)
    doc.text(truncate(doc, u.name, colW[1] - 2), colX[1] + 1, y + 5)
    doc.text(truncate(doc, u.email, colW[2] - 2), colX[2] + 1, y + 5)
    doc.text(u.role, colX[3] + 1, y + 5)
    doc.text(u.isActive ? 'Activo' : 'Inactivo', colX[4] + 1, y + 5)
    doc.text(u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Nunca', colX[5] + 1, y + 5)

    y += rowHeight
  })

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(138, 126, 112)
    doc.text(
      'Pastas artesanales con sabor a tradicion - Posadas, Misiones - Argentina',
      margin,
      pageHeight - 5
    )
    doc.text(`Pagina ${p} de ${pageCount}`, pageWidth - margin - 20, pageHeight - 5)
  }

  const buf = doc.output('arraybuffer')
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="usuarios-cocina-movil-${timestamp}.pdf"`,
    },
  })
}

// Truncate text to fit within a given width (mm) in the PDF
function truncate(doc: { getTextWidth: (text: string) => number }, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 0 && doc.getTextWidth(truncated + '...') > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '...'
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
