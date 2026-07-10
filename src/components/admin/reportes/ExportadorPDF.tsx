'use client'

import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { registrarAuditoria, AccionAuditoria, ModuloAuditoria } from '@/lib/auditoria-service'

interface ExportadorPDFProps {
  data: Record<string, unknown>[]
  filename: string
  title: string
  columns: { key: string; header: string }[]
  modulo?: string
  disabled?: boolean
}

export default function ExportadorPDF({ data, filename, title, columns, modulo, disabled }: ExportadorPDFProps) {
  const exportToPDF = async () => {
    if (!data || data.length === 0) return

    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({ orientation: 'landscape' })

    // Title
    doc.setFontSize(18)
    doc.text('El Amigo de las Pastas', 14, 20)
    doc.setFontSize(12)
    doc.text(title, 14, 30)
    doc.setFontSize(8)
    doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 37)

    // Table header
    const startY = 45
    const cellPadding = 3
    const colWidth = (doc.internal.pageSize.width - 28) / columns.length

    doc.setFillColor(225, 173, 1) // mostaza
    doc.rect(14, startY, doc.internal.pageSize.width - 28, 8, 'F')
    doc.setTextColor(92, 58, 33) // marron
    doc.setFontSize(8)

    columns.forEach((col, i) => {
      doc.text(col.header, 14 + i * colWidth + cellPadding, startY + 6)
    })

    // Table rows
    doc.setTextColor(0, 0, 0)
    let y = startY + 12

    for (const row of data) {
      if (y > doc.internal.pageSize.height - 20) {
        doc.addPage()
        y = 20
      }

      columns.forEach((col, i) => {
        const value = String(row[col.key] ?? '')
        doc.text(value.substring(0, 30), 14 + i * colWidth + cellPadding, y)
      })
      y += 7
    }

    doc.save(`${filename}.pdf`)

    // Registrar auditoría
    registrarAuditoria({
      accion: AccionAuditoria.EXPORT,
      modulo: (modulo as ModuloAuditoria) || ModuloAuditoria.REPORTES,
      detalles: { filename, format: 'pdf', rows: data.length },
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToPDF}
      disabled={disabled || !data || data.length === 0}
      className="gap-1.5 border-rojo/30 text-rojo hover:bg-rojo/10"
    >
      <FileText className="h-4 w-4" />
      PDF
    </Button>
  )
}
