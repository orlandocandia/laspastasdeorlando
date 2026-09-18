'use client'

import { useState, type ComponentType } from 'react'
import { toast } from 'sonner'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { Printer, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface QuickPrintButtonProps<TData> {
  /** URL del API que devuelve el registro completo (JSON) */
  fetchUrl: string
  /** Componente React-PDF que genera el Document. Recibe los datos via prop `data`. */
  DocumentComponent: ComponentType<{ data: TData }>
  /** Funcion opcional para transformar la respuesta del API al shape que espera el Document. */
  mapData?: (raw: any) => TData
  /** Prefijo del nombre de archivo (ej: 'ficha-producto') */
  filename: string
  /** Etiqueta del documento (ej: 'Ficha de Producto') */
  label: string
  /** Tamanio del boton */
  size?: 'icon' | 'sm'
  /** Title/tooltip del trigger */
  triggerTitle?: string
}

/**
 * Boton para listados: al hacer click descarga el registro completo desde el API
 * y genera el PDF (descarga directa). Pensado para tablas donde no se tienen todos
 * los datos del item cargados en memoria.
 */
export default function QuickPrintButton<TData>({
  fetchUrl,
  DocumentComponent,
  mapData,
  filename,
  label,
  size = 'icon',
  triggerTitle,
}: QuickPrintButtonProps<TData>) {
  const [busy, setBusy] = useState(false)

  const handlePrint = async () => {
    setBusy(true)
    try {
      const res = await fetch(fetchUrl)
      if (!res.ok) throw new Error('Error al cargar datos')
      const raw = await res.json()
      const data = mapData ? mapData(raw) : (raw as TData)

      const element = <DocumentComponent data={data} />
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
      toast.success(`Preparando ${label} para imprimir`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el documento')
    } finally {
      setBusy(false)
    }
  }

  if (size === 'sm') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={busy}
        className="gap-1.5 border-marron/30 text-marron hover:bg-marron/10"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        Imprimir
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 hover:bg-mostaza/10"
      onClick={handlePrint}
      disabled={busy}
      title={triggerTitle || `Imprimir ${label}`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin text-mostaza" />
      ) : (
        <Printer className="h-4 w-4 text-marron" />
      )}
    </Button>
  )
}
