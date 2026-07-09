'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { Loader2, Download, Printer, FileSpreadsheet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import ResumenDashboardDocument, {
  type ResumenDashboardData,
} from '@/components/print/ResumenDashboardPDFDocument'

interface DashboardPDFExportProps {
  /** Datos del dashboard ya cargados en la pagina (si estan disponibles) */
  data: ResumenDashboardData | null
  /** Nombre del usuario que genera el reporte */
  usuario?: string
}

/**
 * Botones de exportacion para el dashboard:
 * - PDF (descarga + impresion) del Resumen del Dashboard
 * - Excel del listado de alertas / pasos pendientes
 */
export default function DashboardPDFExport({ data, usuario }: DashboardPDFExportProps) {
  const [busy, setBusy] = useState<'pdf-download' | 'pdf-print' | 'excel' | null>(null)

  const fetchData = async (): Promise<ResumenDashboardData> => {
    if (data) return { ...data, usuarioGenerador: usuario }
    const res = await fetch('/api/dashboard')
    if (!res.ok) throw new Error('Error al cargar dashboard')
    const json = await res.json()
    return { ...json, usuarioGenerador: usuario }
  }

  const handlePdfDownload = async () => {
    setBusy('pdf-download')
    try {
      const dashData = await fetchData()
      const element = <ResumenDashboardDocument data={dashData} />
      const blob = await pdf(element as React.ReactElement<DocumentProps>).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resumen-dashboard-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Resumen del Dashboard descargado')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setBusy(null)
    }
  }

  const handlePdfPrint = async () => {
    setBusy('pdf-print')
    try {
      const dashData = await fetchData()
      const element = <ResumenDashboardDocument data={dashData} />
      const blob = await pdf(element as React.ReactElement<DocumentProps>).toBlob()
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
          toast.error('Error al imprimir. Use el boton Descargar PDF.')
        }
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 2000)
      }
      toast.success('Preparando resumen para imprimir')
    } catch (error) {
      console.error('Error printing PDF:', error)
      toast.error('Error al preparar la impresion')
    } finally {
      setBusy(null)
    }
  }

  const handleAlertasExcel = async () => {
    setBusy('excel')
    try {
      const dashData = await fetchData()
      const pasos = dashData.pasosPendientes || []
      if (pasos.length === 0) {
        toast.warning('No hay alertas para exportar')
        return
      }
      const XLSX = await import('xlsx')
      const rows = pasos.map((p) => ({
        'Severidad': p.severidad === 'critica' ? 'Critica'
          : p.severidad === 'importante' ? 'Importante'
          : 'Informativo',
        'Etapa': p.etapa === 'materias_primas' ? 'Materias Primas'
          : p.etapa === 'recetas' ? 'Recetas'
          : p.etapa === 'produccion' ? 'Produccion'
          : p.etapa === 'stock' ? 'Stock'
          : 'Ventas',
        'Titulo': p.titulo,
        'Descripcion': p.descripcion,
        'Cantidad': p.cantidad,
        'Accion': p.accionLabel,
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Alertas')
      XLSX.writeFile(wb, `alertas-stock-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Listado de alertas exportado a Excel')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Error al exportar Excel')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePdfDownload}
        disabled={busy !== null}
        className="gap-1.5 border-rojo/30 text-rojo hover:bg-rojo/10"
      >
        {busy === 'pdf-download' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePdfPrint}
        disabled={busy !== null}
        className="gap-1.5 border-marron/30 text-marron hover:bg-marron/10"
      >
        {busy === 'pdf-print' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        Imprimir
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAlertasExcel}
        disabled={busy !== null}
        className="gap-1.5 border-oliva/30 text-oliva hover:bg-oliva/10"
      >
        {busy === 'excel' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Alertas Excel
      </Button>
    </div>
  )
}
