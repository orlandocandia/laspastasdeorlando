'use client'

import { useState, useMemo } from 'react'
import { Loader2, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface StockAdjustDialogProps {
  open: boolean
  onClose: () => void
  tipo_item: 'producto_terminado' | 'materia_prima' | 'insumo'
  item_id: number
  item_nombre: string
  stock_actual: number
  stock_minimo: number
  onSuccess: () => void
}

const MOTIVO_OPTIONS = [
  { value: 'carga_inicial', label: 'Carga inicial' },
  { value: 'ajuste', label: 'Ajuste manual' },
  { value: 'correccion', label: 'Corrección' },
  { value: 'devolucion', label: 'Devolución' },
] as const

export function StockAdjustDialog({
  open,
  onClose,
  tipo_item,
  item_id,
  item_nombre,
  stock_actual,
  stock_minimo,
  onSuccess,
}: StockAdjustDialogProps) {
  const [motivo, setMotivo] = useState<string>('carga_inicial')
  const [cantidad, setCantidad] = useState<string>('')
  const [observacion, setObservacion] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const cantidadNum = parseFloat(cantidad) || 0
  const stockResultante = stock_actual + cantidadNum

  const badgeStyle = useMemo(() => {
    if (stockResultante > stock_minimo) {
      return 'bg-oliva/15 text-oliva hover:bg-oliva/25 border-oliva/20'
    }
    if (stockResultante > 0) {
      return 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25 border-mostaza/20'
    }
    return 'bg-rojo/15 text-rojo hover:bg-rojo/25 border-rojo/20'
  }, [stockResultante, stock_minimo])

  function handleClose() {
    setMotivo('carga_inicial')
    setCantidad('')
    setObservacion('')
    onClose()
  }

  async function handleSubmit() {
    if (cantidadNum <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_item,
          item_id,
          cantidad: cantidadNum,
          motivo,
          observacion,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar el stock')
      }

      toast.success('Stock actualizado correctamente')
      onSuccess()
      handleClose()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado al actualizar el stock'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-marron flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-mostaza" />
            Cargar Stock — {item_nombre}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ingresá la cantidad a sumar al inventario de este item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Stock info */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-marron font-medium">
              Stock actual: <strong>{stock_actual}</strong> unidades
            </span>
            <span className="text-muted-foreground">
              Stock mínimo: <strong>{stock_minimo}</strong> unidades
            </span>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo-select">Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger id="motivo-select" className="w-full">
                <SelectValue placeholder="Seleccioná un motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="cantidad-input">Cantidad a sumar</Label>
            <Input
              id="cantidad-input"
              type="number"
              min="0.01"
              step="any"
              placeholder="Ingresá la cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          {/* Observación */}
          <div className="space-y-2">
            <Label htmlFor="observacion-input">
              Observación <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="observacion-input"
              placeholder="Notas o detalles sobre este ajuste..."
              className="resize-none"
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          {/* Stock resultante preview */}
          <div className="flex items-center gap-2 rounded-md bg-muted/60 p-3">
            <span className="text-sm text-marron font-medium">Stock resultante:</span>
            <span className="text-sm text-muted-foreground">
              {stock_actual} + {cantidadNum} =
            </span>
            <Badge className={badgeStyle}>{stockResultante} unidades</Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
            disabled={submitting || cantidadNum <= 0}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              'Confirmar Carga'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
