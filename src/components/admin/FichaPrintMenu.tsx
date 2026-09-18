'use client'

import { useState, type ComponentType } from 'react'
import { toast } from 'sonner'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { Printer, Loader2, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface FichaPrintMenuProps<TData> {
  /** Datos completos del item a exportar */
  data: TData
  /** Componente React-PDF que genera el Document. Recibe los datos vía prop `data`. */
  DocumentComponent: ComponentType<{ data: TData }>
  /** Prefijo del nombre de archivo (ej: 'ficha-producto') */
  filename: string
  /** Etiqueta del documento (ej: 'Ficha de Producto') */
  label: string
  /** Tamaño del botón */
  size?: 'icon' | 'sm'
  /** Title/tooltip del trigger */
  triggerTitle?: string
}

export default function FichaPrintMenu<TData>({
  data,
  DocumentComponent,
  filename,
  label,
  size = 'icon',
  triggerTitle,
}: FichaPrintMenuProps<TData>) {
  const [generating, setGenerating] = useState<'download' | 'print' | null>(null)

  const buildPdf = async (): Promise<Blob> => {
    const element = <DocumentComponent data={data} />
    // Use type assertion to satisfy @react-pdf/renderer's pdf() overload which
    // expects a ReactElement<DocumentProps>. Our component is generic so TS can't
    // verify the inner props match, but at runtime it's a valid Document.
    return await pdf(element as React.ReactElement<DocumentProps>).toBlob()
  }

  const handleDownload = async () => {
    setGenerating('download')
    try {
      const blob = await buildPdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${label} descargada`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el documento')
    } finally {
      setGenerating(null)
    }
  }

  const handlePrint = async () => {
    setGenerating('print')
    try {
      const blob = await buildPdf()
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
      toast.success(`Preparando ${label} para imprimir`)
    } catch (error) {
      console.error('Error printing PDF:', error)
      toast.error('Error al preparar la impresión')
    } finally {
      setGenerating(null)
    }
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={generating !== null}
          className="gap-1.5 border-rojo/30 text-rojo hover:bg-rojo/10"
        >
          {generating === 'download' ? (
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
          disabled={generating !== null}
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-mostaza/10"
          disabled={generating !== null}
          title={triggerTitle || 'Imprimir / Exportar'}
        >
          {generating !== null ? (
            <Loader2 className="h-4 w-4 animate-spin text-mostaza" />
          ) : (
            <Printer className="h-4 w-4 text-marron" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-marron font-semibold">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4 text-rojo" />
          <span>Descargar PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
          <Printer className="mr-2 h-4 w-4 text-oliva" />
          <span>Imprimir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
