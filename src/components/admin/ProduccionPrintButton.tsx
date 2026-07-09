'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { Printer, Loader2, FileDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  OrdenProduccionPDFDocument,
  type OrdenProduccionData,
} from '@/components/print/OrdenProduccionPDFDocument'

interface ProduccionPrintButtonProps {
  orden: OrdenProduccionData
  variant?: 'icon' | 'full'
}

export default function ProduccionPrintButton({ orden, variant = 'icon' }: ProduccionPrintButtonProps) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const blob = await pdf(<OrdenProduccionPDFDocument orden={orden} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const numero = `OP-${String(orden.id).padStart(6, '0')}`
      a.download = `orden-produccion-${numero}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Orden de Producción generada')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = async () => {
    setGenerating(true)
    try {
      const blob = await pdf(<OrdenProduccionPDFDocument orden={orden} />).toBlob()
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (win) {
        win.onload = () => {
          setTimeout(() => win.print(), 500)
        }
      }
      // Revoke after delay to allow print
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      toast.success('Abriendo para imprimir...')
    } catch (error) {
      console.error('Error printing PDF:', error)
      toast.error('Error al imprimir')
    } finally {
      setGenerating(false)
    }
  }

  if (variant === 'full') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={generating}
            className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Imprimir / Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
            <FileDown className="mr-2 h-4 w-4 text-rojo" />
            <span>Exportar PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
            <Printer className="mr-2 h-4 w-4 text-mostaza" />
            <span>Imprimir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-mostaza/10"
          disabled={generating}
          title="Imprimir / Exportar PDF"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin text-mostaza" />
          ) : (
            <Printer className="h-4 w-4 text-mostaza" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
          <FileDown className="mr-2 h-4 w-4 text-rojo" />
          <span>Exportar PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
          <Printer className="mr-2 h-4 w-4 text-mostaza" />
          <span>Imprimir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
