'use client'

import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProductoParaEtiqueta {
  id: number
  nombre: string
  codigo_barras: string | null
  codigo: string | null
  precio_venta: number
  peso_unitario_aprox: number
  unidades?: number | null
  categoria?: { nombre: string } | null
}

interface EtiquetaProductoProps {
  producto: ProductoParaEtiqueta | null
  open: boolean
  onClose: () => void
}

export function EtiquetaProducto({ producto, open, onClose }: EtiquetaProductoProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)
  const [copias, setCopias] = useState(1)

  useEffect(() => {
    if (barcodeRef.current && producto?.codigo_barras) {
      try {
        JsBarcode(barcodeRef.current, producto.codigo_barras, {
          format: producto.codigo_barras.length === 13 ? 'EAN13' : 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: 'transparent',
        })
      } catch {
        // Si falla EAN13, intentar CODE128
        try {
          JsBarcode(barcodeRef.current, producto.codigo_barras, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
            background: 'transparent',
          })
        } catch (err) {
          console.error('Error generando código de barras:', err)
        }
      }
    }
  }, [producto, open])

  const handlePrint = () => {
    const printContent = document.getElementById('etiqueta-print-area')
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta - ${producto?.nombre || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; }
          .etiqueta {
            width: 76mm;
            height: auto;
            min-height: 50mm;
            padding: 4mm;
            border: 1px dashed #ccc;
            margin: 2mm;
            page-break-after: always;
          }
          .etiqueta:last-child { page-break-after: auto; }
          .nombre { font-size: 11pt; font-weight: bold; text-align: center; margin-bottom: 2mm; }
          .codigo-texto { font-size: 8pt; text-align: center; color: #666; margin-bottom: 1mm; }
          .barcode-svg { text-align: center; }
          .barcode-svg svg { max-width: 100%; }
          .precio { font-size: 14pt; font-weight: bold; text-align: center; margin-top: 2mm; color: #C41E3A; }
          .peso { font-size: 8pt; text-align: center; color: #666; }
          .categoria { font-size: 7pt; text-align: center; color: #999; }
          @media print {
            .etiqueta { border: none; }
          }
        </style>
      </head>
      <body>
        ${Array.from({ length: copias }, () => printContent.innerHTML).join('')}
      </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for SVG to render then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  if (!producto) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🏷️ Etiqueta de Producto
          </DialogTitle>
        </DialogHeader>

        {/* Vista previa */}
        <div id="etiqueta-print-area">
          <div className="etiqueta bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 mx-auto" style={{ width: '76mm', minHeight: '50mm' }}>
            <div className="text-center font-bold text-sm mb-1 truncate">
              {producto.nombre}
            </div>

            {producto.categoria && (
              <div className="text-center text-[10px] text-gray-500 mb-1">
                {producto.categoria.nombre}
              </div>
            )}

            {producto.codigo_barras ? (
              <div className="flex justify-center my-2">
                <svg ref={barcodeRef} />
              </div>
            ) : (
              <div className="text-center text-xs text-gray-400 my-4">
                Sin código de barras
              </div>
            )}

            {producto.codigo && (
              <div className="text-center text-[10px] text-gray-500 mb-1">
                Código: {producto.codigo}
              </div>
            )}

            {producto.peso_unitario_aprox > 0 && (
              <div className="text-center text-[10px] text-gray-500">
                {producto.peso_unitario_aprox} kg aprox.
              </div>
            )}

            {producto.unidades && producto.unidades > 0 && (
              <div className="text-center text-[10px] text-gray-500">
                Contiene: {producto.unidades} unidades
              </div>
            )}

            <div className="text-center font-bold text-lg text-rojo mt-2">
              ${producto.precio_venta.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Copias:</label>
            <input
              type="number"
              min={1}
              max={50}
              value={copias}
              onChange={(e) => setCopias(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className="w-16 px-2 py-1 border rounded text-center text-sm"
            />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cerrar
            </Button>
            <Button size="sm" onClick={handlePrint} disabled={!producto.codigo_barras}>
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
          </div>
        </div>

        {!producto.codigo_barras && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ Este producto no tiene código de barras asignado. Agregá uno desde el formulario de edición del producto.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
