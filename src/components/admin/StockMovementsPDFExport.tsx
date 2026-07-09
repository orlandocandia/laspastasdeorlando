'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { Loader2, Download, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import ReporteMovimientosStockDocument, {
  type ReporteMovimientosStockData,
} from '@/components/print/ReporteMovimientosStockPDFDocument'

/**
 * Boton de exportacion PDF + impresion para el reporte de movimientos de stock.
 * Descarga todos los movimientos desde el API y genera el documento PDF.
 */
export default function StockMovementsPDFExport() {
  const [busy, setBusy] = useState<'download' | 'print' | null>(null)

  const fetchData = async (): Promise<ReporteMovimientosStockData> => {
    const res = await fetch('/api/stock-movements?limite=1000')
    if (!res.ok) throw new Error('Error al cargar movimientos')
    const json = await res.json()
    return {
      movimientos: json.data || [],
      total: json.total,
    }
  }

  const handleDownload = async () => {
    setBusy('download')
    try {
      const data = await fetchData()
      if (data.movimientos.length === 0) {
        toast.warning('No hay movimientos para exportar')
        return
      }
      const element = <ReporteMovimientosStockDocument data={data} />
      const blob = await pdf(element as React.ReactElement<DocumentProps>).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-movimientos-stock-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Reporte PDF descargado')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el reporte PDF')
    } finally {
      setBusy(null)
    }
  }

  const handlePrint = async () => {
    setBusy('print')
    try {
      const data = await fetchData()
      if (data.movimientos.length === 0) {
        toast.warning('No hay movimientos para imprimir')
        return
      }
      const element = <ReporteMovimientosStockDocument data={data} />
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
      toast.success('Preparando reporte para imprimir')
    } catch (error) {
      console.error('Error printing PDF:', error)
      toast.error('Error al preparar la impresion')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={busy !== null}
        className="gap-1.5 border-rojo/30 text-rojo hover:bg-rojo/10"
      >
        {busy === 'download' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={busy !== null}
        className="gap-1.5 border-marron/30 text-marron hover:bg-marron/10"
      >
        {busy === 'print' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        Imprimir
      </Button>
    </div>
  )
}
