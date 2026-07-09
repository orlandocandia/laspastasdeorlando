'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import {
  Printer, Loader2, FileText, Receipt, Package, ClipboardList,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FacturaDocument, TicketDocument, RemitoDocument, OrdenVentaDocument,
  type VentaDocData,
} from '@/components/print/VentasDocumentPDF'

interface VentasPrintMenuProps {
  venta: VentaDocData
}

type DocType = 'factura' | 'ticket' | 'remito' | 'orden'

const DOC_CONFIG: Record<DocType, { label: string; icon: typeof FileText; component: typeof FacturaDocument }> = {
  factura: { label: 'Factura', icon: FileText, component: FacturaDocument },
  ticket: { label: 'Ticket', icon: Receipt, component: TicketDocument },
  remito: { label: 'Remito', icon: Package, component: RemitoDocument },
  orden: { label: 'Orden de Venta', icon: ClipboardList, component: OrdenVentaDocument },
}

export default function VentasPrintMenu({ venta }: VentasPrintMenuProps) {
  const [generating, setGenerating] = useState<DocType | null>(null)

  const handleGenerate = async (type: DocType) => {
    setGenerating(type)
    try {
      const config = DOC_CONFIG[type]
      const DocComponent = config.component
      const blob = await pdf(<DocComponent venta={venta} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const comprobante = venta.numero_comprobante || `V-${String(venta.id).padStart(6, '0')}`
      a.download = `${type}-${comprobante}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${config.label} generada`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el documento')
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleGenerate('factura')} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4 text-rojo" />
          <span>Factura</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleGenerate('ticket')} className="cursor-pointer">
          <Receipt className="mr-2 h-4 w-4 text-mostaza" />
          <span>Ticket</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleGenerate('remito')} className="cursor-pointer">
          <Package className="mr-2 h-4 w-4 text-oliva" />
          <span>Remito</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleGenerate('orden')} className="cursor-pointer">
          <ClipboardList className="mr-2 h-4 w-4 text-marron" />
          <span>Orden de Venta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
