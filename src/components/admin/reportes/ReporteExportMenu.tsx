'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { FileDown, Printer, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ReporteVentasDocument,
  ReporteStockDocument,
  ReporteProduccionDocument,
  ReporteComprasDocument,
  type ReporteVentasData,
  type ReporteStockData,
  type ReporteProduccionData,
  type ReporteComprasData,
} from '@/components/print/ReportesPDFDocument'
import { registrarAuditoria, AccionAuditoria, ModuloAuditoria } from '@/lib/auditoria-service'

type ReporteTipo = 'ventas' | 'stock' | 'produccion' | 'compras'

interface ReporteExportMenuProps<T extends ReporteTipo> {
  tipo: T
  data: (T extends 'ventas'
    ? ReporteVentasData
    : T extends 'stock'
    ? ReporteStockData
    : T extends 'produccion'
    ? ReporteProduccionData
    : ReporteComprasData) | null
  filename: string
  disabled?: boolean
}

function getDocument(tipo: ReporteTipo) {
  switch (tipo) {
    case 'ventas': return ReporteVentasDocument
    case 'stock': return ReporteStockDocument
    case 'produccion': return ReporteProduccionDocument
    case 'compras': return ReporteComprasDocument
  }
}

function getTitulo(tipo: ReporteTipo) {
  switch (tipo) {
    case 'ventas': return 'Reporte de Ventas'
    case 'stock': return 'Reporte de Stock'
    case 'produccion': return 'Reporte de Producción'
    case 'compras': return 'Reporte de Compras'
  }
}

export default function ReporteExportMenu<T extends ReporteTipo>({
  tipo,
  data,
  filename,
  disabled,
}: ReporteExportMenuProps<T>) {
  const [generating, setGenerating] = useState<'download' | 'print' | null>(null)

  const handleDownload = async () => {
    if (!data) {
      toast.error('No hay datos para exportar')
      return
    }
    setGenerating('download')
    try {
      const DocComponent = getDocument(tipo)
      // @ts-expect-error - data type is narrowed by T but TS can't infer across the union here
      const blob = await pdf(<DocComponent data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const stamp = new Date().toISOString().slice(0, 10)
      a.download = `${filename}_${stamp}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${getTitulo(tipo)} exportado a PDF`)

      registrarAuditoria({
        accion: AccionAuditoria.EXPORT,
        modulo: ModuloAuditoria.REPORTES,
        detalles: { tipo, filename, format: 'pdf' },
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setGenerating(null)
    }
  }

  const handlePrint = async () => {
    if (!data) {
      toast.error('No hay datos para imprimir')
      return
    }
    setGenerating('print')
    try {
      const DocComponent = getDocument(tipo)
      // @ts-expect-error - data type is narrowed by T but TS can't infer across the union here
      const blob = await pdf(<DocComponent data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch (e) {
          console.error('Print error:', e)
          toast.error('Error al imprimir. Use el botón Descargar PDF.')
        }
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 2000)
      }
      toast.success(`Preparando ${getTitulo(tipo)} para imprimir`)

      registrarAuditoria({
        accion: AccionAuditoria.EXPORT,
        modulo: ModuloAuditoria.REPORTES,
        detalles: { tipo, filename, format: 'print' },
      })
    } catch (error) {
      console.error('Error printing PDF:', error)
      toast.error('Error al preparar la impresión')
    } finally {
      setGenerating(null)
    }
  }

  const isDisabled = disabled || !data

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isDisabled || generating !== null}
        className="gap-1.5 border-rojo/30 text-rojo hover:bg-rojo/10"
      >
        {generating === 'download' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={isDisabled || generating !== null}
        className="gap-1.5 border-marron/30 text-marron hover:bg-marron/10"
      >
        {generating === 'print' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        Imprimir
      </Button>
    </div>
  )
}
