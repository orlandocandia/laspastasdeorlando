'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Loader2, PackagePlus, Search } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ProductoOpcion {
  id: number
  nombre: string
  codigo?: string | null
  stock_actual: number
  stock_minimo: number
  categoria?: { nombre: string } | null
}

interface StockInitialLoadDialogProps {
  open: boolean
  onClose: () => void
  /** Si se pasa, el producto viene pre-seleccionado (desde editar producto) */
  preselectedProduct?: {
    id: number
    nombre: string
    stock_actual: number
    stock_minimo: number
  } | null
  onSuccess: () => void
}

export function StockInitialLoadDialog({
  open,
  onClose,
  preselectedProduct,
  onSuccess,
}: StockInitialLoadDialogProps) {
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [searchProducto, setSearchProducto] = useState('')
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null)
  const [cantidad, setCantidad] = useState<string>('')
  const [observacion, setObservacion] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const isPreselected = !!preselectedProduct

  // When preselected product changes, set it
  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProductoId(preselectedProduct.id)
    }
  }, [preselectedProduct])

  // Fetch active products for the selector
  const fetchProductos = useCallback(async () => {
    if (isPreselected) return // No need to fetch if preselected
    setLoadingProductos(true)
    try {
      const params = new URLSearchParams()
      params.set('estado', 'true')
      params.set('limite', '200')
      const res = await fetch(`/api/productos-terminados?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar productos')
      const data = await res.json()
      setProductos(data.data || [])
    } catch {
      toast.error('Error al cargar la lista de productos')
    } finally {
      setLoadingProductos(false)
    }
  }, [isPreselected])

  useEffect(() => {
    if (open && !isPreselected) {
      fetchProductos()
    }
  }, [open, isPreselected, fetchProductos])

  // Get the selected product details
  const selectedProduct = useMemo(() => {
    if (preselectedProduct) return preselectedProduct
    return productos.find((p) => p.id === selectedProductoId) || null
  }, [preselectedProduct, productos, selectedProductoId])

  const cantidadNum = parseFloat(cantidad) || 0
  const stockActual = selectedProduct?.stock_actual ?? 0
  const stockMinimo = selectedProduct?.stock_minimo ?? 0
  const stockResultante = stockActual + cantidadNum

  const badgeStyle = useMemo(() => {
    if (stockResultante > stockMinimo) {
      return 'bg-oliva/15 text-oliva hover:bg-oliva/25 border-oliva/20'
    }
    if (stockResultante > 0) {
      return 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25 border-mostaza/20'
    }
    return 'bg-rojo/15 text-rojo hover:bg-rojo/25 border-rojo/20'
  }, [stockResultante, stockMinimo])

  // Filter products by search
  const filteredProductos = useMemo(() => {
    if (!searchProducto.trim()) return productos
    const q = searchProducto.toLowerCase()
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigo && p.codigo.toLowerCase().includes(q)) ||
        (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(q))
    )
  }, [productos, searchProducto])

  function handleClose() {
    setSearchProducto('')
    setSelectedProductoId(null)
    setCantidad('')
    setObservacion('')
    onClose()
  }

  async function handleSubmit() {
    if (!selectedProductoId) {
      toast.error('Seleccioná un producto')
      return
    }
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
          tipo_item: 'producto_terminado',
          item_id: selectedProductoId,
          cantidad: cantidadNum,
          motivo: 'carga_inicial',
          observacion: observacion || undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar el stock')
      }

      const result = await res.json()
      toast.success('Stock inicial cargado correctamente', {
        description: `${selectedProduct?.nombre}: ${stockActual} → ${result.stock_despues} unidades`,
      })
      onSuccess()
      handleClose()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado al cargar stock'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-marron flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-oliva" />
            Cargar Stock Inicial
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isPreselected
              ? `Cargá stock inicial para ${preselectedProduct?.nombre}`
              : 'Seleccioná un producto y cargá su stock inicial. Quedará registrado en Movimientos de Stock.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product selector — only if not preselected */}
          {!isPreselected && (
            <div className="space-y-2">
              <Label>Producto *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchProducto}
                  onChange={(e) => setSearchProducto(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border border-marron/10 bg-background">
                {loadingProductos ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-mostaza" />
                  </div>
                ) : filteredProductos.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No se encontraron productos
                  </div>
                ) : (
                  filteredProductos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-mostaza/5 transition-colors ${
                        selectedProductoId === p.id
                          ? 'bg-mostaza/10 border-l-2 border-mostaza'
                          : 'border-l-2 border-transparent'
                      }`}
                      onClick={() => setSelectedProductoId(p.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-marron truncate">
                          {p.nombre}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {p.codigo && `${p.codigo} · `}
                          {p.categoria?.nombre || 'Sin categoría'}
                        </span>
                      </div>
                      <Badge
                        className={`shrink-0 text-xs ${
                          p.stock_actual <= 0
                            ? 'bg-rojo/10 text-rojo'
                            : p.stock_actual <= p.stock_minimo
                            ? 'bg-mostaza/10 text-mostaza'
                            : 'bg-oliva/10 text-oliva'
                        }`}
                      >
                        {p.stock_actual} u.
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Preselected product info */}
          {isPreselected && preselectedProduct && (
            <div className="rounded-lg bg-muted/50 p-3 border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-marron">
                  {preselectedProduct.nombre}
                </span>
                <Badge
                  className={
                    preselectedProduct.stock_actual <= 0
                      ? 'bg-rojo/10 text-rojo'
                      : preselectedProduct.stock_actual <= preselectedProduct.stock_minimo
                      ? 'bg-mostaza/10 text-mostaza'
                      : 'bg-oliva/10 text-oliva'
                  }
                >
                  {preselectedProduct.stock_actual} u.
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Stock actual: {preselectedProduct.stock_actual} · Stock mínimo: {preselectedProduct.stock_minimo}
              </p>
            </div>
          )}

          {/* Selected product stock info (from selector) */}
          {!isPreselected && selectedProduct && (
            <>
              <Separator />
              <div className="flex items-center gap-4 text-sm">
                <span className="text-marron font-medium">
                  Stock actual: <strong>{stockActual}</strong> u.
                </span>
                <span className="text-muted-foreground">
                  Mínimo: <strong>{stockMinimo}</strong> u.
                </span>
              </div>
            </>
          )}

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="cantidad-inicial">Cantidad a cargar *</Label>
            <Input
              id="cantidad-inicial"
              type="number"
              min="0.01"
              step="any"
              placeholder="Ingresá la cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              autoFocus={isPreselected}
            />
            <p className="text-xs text-muted-foreground">
              Solo se pueden cargar cantidades positivas (sumar stock).
            </p>
          </div>

          {/* Observación */}
          <div className="space-y-2">
            <Label htmlFor="observacion-inicial">
              Observación <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="observacion-inicial"
              placeholder="Ej: Stock inicial de la primera producción..."
              className="resize-none"
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          {/* Stock resultante preview */}
          {selectedProduct && cantidadNum > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-muted/60 p-3">
              <span className="text-sm text-marron font-medium">Stock resultante:</span>
              <span className="text-sm text-muted-foreground">
                {stockActual} + {cantidadNum} =
              </span>
              <Badge className={badgeStyle}>{stockResultante} u.</Badge>
            </div>
          )}

          {/* Info notice */}
          <div className="rounded-md bg-oliva/5 border border-oliva/20 p-3 text-xs text-oliva">
            <strong>Trazabilidad:</strong> Este movimiento quedará registrado en Movimientos de Stock como &quot;Carga inicial&quot;. No modifica materias primas ni insumos.
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
            className="bg-oliva hover:bg-oliva/90 text-white font-semibold"
            disabled={submitting || !selectedProductoId || cantidadNum <= 0}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <PackagePlus className="mr-2 h-4 w-4" />
                Cargar Stock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
