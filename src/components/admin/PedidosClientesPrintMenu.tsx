'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import {
  Printer, Loader2, FileText, Package, Download,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  OrdenPedidoDocument, RemitoPedidoDocument,
  type PedidoClienteDocData,
} from '@/components/print/PedidoClientePDFDocument'

interface PedidosClientesPrintMenuProps {
  pedido: PedidoClienteDocData
}

type DocType = 'orden' | 'remito'

const DOC_CONFIG: Record<DocType, { label: string; icon: typeof FileText; component: typeof OrdenPedidoDocument }> = {
  orden: { label: 'Orden de Pedido', icon: FileText, component: OrdenPedidoDocument },
  remito: { label: 'Remito', icon: Package, component: RemitoPedidoDocument },
}

export default function PedidosClientesPrintMenu({ pedido }: PedidosClientesPrintMenuProps) {
  const [generating, setGenerating] = useState<DocType | null>(null)

  const getNumero = () => `PC-${String(pedido.id).padStart(6, '0')}`

  const handleDownload = async (type: DocType) => {
    setGenerating(type)
    try {
      const config = DOC_CONFIG[type]
      const DocComponent = config.component
      const blob = await pdf(<DocComponent pedido={pedido} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${getNumero()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${config.label} descargada`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el documento')
    } finally {
      setGenerating(null)
    }
  }

  const handlePrint = async (type: DocType) => {
    setGenerating(type)
    try {
      const config = DOC_CONFIG[type]
      const DocComponent = config.component
      const blob = await pdf(<DocComponent pedido={pedido} />).toBlob()
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
          toast.error('Error al imprimir. Use el botón Descargar.')
        }
        // Cleanup after a delay to allow print dialog
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 2000)
      }
      toast.success(`Preparando ${config.label} para imprimir`)
    } catch (error) {
      console.error('Error printing PDF:', error)
      toast.error('Error al preparar la impresión')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-mostaza/10"
          disabled={generating !== null}
          title="Imprimir / Exportar"
        >
          {generating !== null ? (
            <Loader2 className="h-4 w-4 animate-spin text-mostaza" />
          ) : (
            <Printer className="h-4 w-4 text-mostaza" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-marron font-semibold">
          Documentos del Pedido
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(['orden', 'remito'] as DocType[]).map((type) => {
          const config = DOC_CONFIG[type]
          const Icon = config.icon
          return (
            <div key={type}>
              <DropdownMenuItem
                onClick={() => handleDownload(type)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4 text-marron" />
                <span className="flex-1">{config.label}</span>
                <Download className="h-3 w-3 text-muted-foreground" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePrint(type)}
                className="cursor-pointer"
              >
                <Printer className="mr-2 h-4 w-4 text-oliva" />
                <span className="flex-1">Imprimir {config.label}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
