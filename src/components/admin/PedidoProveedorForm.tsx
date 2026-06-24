'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface Proveedor {
  id: number
  nombre: string
  apellido: string
  razon_social: string | null
}

interface EstadoGeneral {
  id: number
  nombre_estado: string
  entidad_aplicable: string | null
}

interface ProductoItem {
  id: number
  nombre: string
  id_unidad_base: number
  unidadBase: { id: number; codigo: string; nombre: string }
  precio_compra_referencia: number
  tipo: 'mp' | 'insumo'
}

interface DetalleRow {
  key: string
  tipo: 'mp' | 'insumo'
  id_producto: string
  cantidad: string
  unidad: string
  unidadCodigo: string
  precioEstimado: string
}

interface PedidoProveedorFormProps {
  pedido?: any | null
  onSuccess: () => void
  onCancel: () => void
}

export default function PedidoProveedorForm({ pedido, onSuccess, onCancel }: PedidoProveedorFormProps) {
  const isEditing = !!pedido

  // Form fields
  const [idProveedor, setIdProveedor] = useState('')
  const [fechaPedido, setFechaPedido] = useState('')
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState('')
  const [idEstado, setIdEstado] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Detail rows
  const [detalles, setDetalles] = useState<DetalleRow[]>([])

  // Data
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [estados, setEstados] = useState<EstadoGeneral[]>([])
  const [materiasPrimas, setMateriasPrimas] = useState<ProductoItem[]>([])
  const [insumos, setInsumos] = useState<ProductoItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Combobox open states
  const [proveedorOpen, setProveedorOpen] = useState(false)

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [provRes, estRes, mpRes, insRes] = await Promise.all([
          fetch('/api/personas?tipo=proveedor&limite=100'),
          fetch('/api/estados-generales?entidad_aplicable=pedido_proveedor'),
          fetch('/api/materias-primas?limite=200&estado=true'),
          fetch('/api/insumos?limite=200&estado=true'),
        ])

        const provData = await provRes.json()
        const estData = await estRes.json()
        const mpData = await mpRes.json()
        const insData = await insRes.json()

        setProveedores(provData.personas || [])
        setEstados(Array.isArray(estData) ? estData : [])
        setMateriasPrimas(
          (mpData.data || []).map((mp: any) => ({
            id: mp.id,
            nombre: mp.nombre,
            id_unidad_base: mp.id_unidad_base,
            unidadBase: mp.unidadBase,
            precio_compra_referencia: mp.precio_compra_referencia,
            tipo: 'mp' as const,
          }))
        )
        setInsumos(
          (insData.data || []).map((ins: any) => ({
            id: ins.id,
            nombre: ins.nombre,
            id_unidad_base: ins.id_unidad_base,
            unidadBase: ins.unidadBase,
            precio_compra_referencia: ins.precio_compra_referencia,
            tipo: 'insumo' as const,
          }))
        )
      } catch {
        toast.error('Error al cargar datos del formulario')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (pedido) {
      setIdProveedor(pedido.id_proveedor?.toString() || '')
      setFechaPedido(pedido.fecha_pedido ? pedido.fecha_pedido.split('T')[0] : '')
      setFechaEntregaEstimada(
        pedido.fecha_entrega_estimada ? pedido.fecha_entrega_estimada.split('T')[0] : ''
      )
      setIdEstado(pedido.id_estado?.toString() || '')
      setObservaciones(pedido.observaciones || '')

      if (pedido.detalle && Array.isArray(pedido.detalle)) {
        setDetalles(
          pedido.detalle.map((d: any) => ({
            key: `row-${d.id}`,
            tipo: d.id_materia_prima ? 'mp' : 'insumo',
            id_producto: (d.id_materia_prima || d.id_insumo)?.toString() || '',
            cantidad: d.cantidad_pedida?.toString() || '',
            unidad: d.unidad?.id?.toString() || '',
            unidadCodigo: d.unidad?.codigo || '',
            precioEstimado: d.precio_estimado?.toString() || '',
          }))
        )
      }
    } else {
      // Defaults for new
      setFechaPedido(new Date().toISOString().split('T')[0])
      addDetailRow()
    }
  }, [pedido])

  // Products filtered by selected tipo for each row
  const getProductsForTipo = (tipo: 'mp' | 'insumo') => {
    return tipo === 'mp' ? materiasPrimas : insumos
  }

  // Find product by id
  const findProduct = (tipo: 'mp' | 'insumo', id: string) => {
    const products = getProductsForTipo(tipo)
    return products.find((p) => p.id.toString() === id)
  }

  // Add detail row
  const addDetailRow = () => {
    setDetalles((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo: 'mp',
        id_producto: '',
        cantidad: '',
        unidad: '',
        unidadCodigo: '',
        precioEstimado: '',
      },
    ])
  }

  // Remove detail row
  const removeDetailRow = (key: string) => {
    setDetalles((prev) => prev.filter((d) => d.key !== key))
  }

  // Update detail row
  const updateDetalle = (key: string, field: keyof DetalleRow, value: string) => {
    setDetalles((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d

        const updated = { ...d, [field]: value }

        // When tipo changes, reset producto and unidad
        if (field === 'tipo') {
          updated.id_producto = ''
          updated.unidad = ''
          updated.unidadCodigo = ''
          updated.precioEstimado = ''
        }

        // When product changes, auto-fill unidad and precio_referencia
        if (field === 'id_producto' && value) {
          const product = findProduct(updated.tipo, value)
          if (product) {
            updated.unidad = product.unidadBase?.id?.toString() || ''
            updated.unidadCodigo = product.unidadBase?.codigo || ''
            updated.precioEstimado = product.precio_compra_referencia?.toString() || ''
          }
        }

        return updated
      })
    )
  }

  // Calculate total estimado
  const totalEstimado = useMemo(() => {
    return detalles.reduce((sum, d) => {
      const cant = parseFloat(d.cantidad)
      const precio = parseFloat(d.precioEstimado)
      if (isNaN(cant) || isNaN(precio)) return sum
      return sum + cant * precio
    }, 0)
  }, [detalles])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!isEditing) {
      if (!idProveedor) {
        toast.error('Seleccioná un proveedor')
        return
      }
      if (!fechaPedido) {
        toast.error('Ingresá la fecha del pedido')
        return
      }
      if (detalles.length === 0) {
        toast.error('Agregá al menos un detalle al pedido')
        return
      }
      for (let i = 0; i < detalles.length; i++) {
        const d = detalles[i]
        if (!d.id_producto) {
          toast.error(`Fila ${i + 1}: Seleccioná un producto`)
          return
        }
        if (!d.cantidad || parseFloat(d.cantidad) <= 0) {
          toast.error(`Fila ${i + 1}: Ingresá una cantidad válida`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const payload = isEditing
        ? {
            id: pedido.id,
            fecha_entrega_estimada: fechaEntregaEstimada || null,
            id_estado: idEstado ? parseInt(idEstado) : undefined,
            observaciones: observaciones.trim() || null,
          }
        : {
            id_proveedor: parseInt(idProveedor),
            fecha_pedido: fechaPedido,
            fecha_entrega_estimada: fechaEntregaEstimada || null,
            observaciones: observaciones.trim() || null,
            total_estimado: totalEstimado,
            detalle: detalles.map((d) => ({
              tipo: d.tipo,
              id_producto: parseInt(d.id_producto),
              cantidad_pedida: parseFloat(d.cantidad),
              id_unidad: parseInt(d.unidad),
              precio_estimado: parseFloat(d.precioEstimado) || 0,
            })),
          }

      const url = isEditing ? `/api/pedidos-proveedores/${pedido.id}` : '/api/pedidos-proveedores'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar pedido')
      }

      toast.success(isEditing ? 'Pedido actualizado' : 'Pedido registrado', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'El nuevo pedido se registró exitosamente',
      })
      onSuccess()
    } catch (error: any) {
      toast.error('Error al guardar', {
        description: error.message || 'Intentá de nuevo más tarde',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-mostaza" />
        <span className="ml-2 text-muted-foreground">Cargando datos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      {isEditing && (
        <div className="bg-muted/30 rounded-lg p-3 border border-marron/10">
          <p className="text-sm text-muted-foreground">
            Pedido #{pedido.id} — Proveedor: {pedido.proveedor?.razon_social || `${pedido.proveedor?.nombre} ${pedido.proveedor?.apellido}`}
          </p>
        </div>
      )}

      {/* Main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Proveedor - searchable combobox */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Proveedor *</Label>
          {isEditing ? (
            <Input
              value={pedido.proveedor?.razon_social || `${pedido.proveedor?.nombre} ${pedido.proveedor?.apellido}`}
              disabled
              className="bg-muted/50"
            />
          ) : (
            <Popover open={proveedorOpen} onOpenChange={setProveedorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={proveedorOpen}
                  className={cn(
                    'w-full justify-between',
                    !idProveedor && 'text-muted-foreground'
                  )}
                >
                  {idProveedor
                    ? (() => {
                        const prov = proveedores.find((p) => p.id.toString() === idProveedor)
                        return prov?.razon_social || `${prov?.nombre} ${prov?.apellido}` || 'Seleccionar...'
                      })()
                    : 'Buscar proveedor...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar proveedor..." />
                  <CommandList>
                    <CommandEmpty>No se encontró proveedor</CommandEmpty>
                    <CommandGroup>
                      {proveedores.map((prov) => (
                        <CommandItem
                          key={prov.id}
                          value={prov.razon_social || `${prov.nombre} ${prov.apellido}`}
                          onSelect={() => {
                            setIdProveedor(prov.id.toString())
                            setProveedorOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              idProveedor === prov.id.toString() ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {prov.razon_social || `${prov.nombre} ${prov.apellido}`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Fecha pedido */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Fecha Pedido *</Label>
          <Input
            type="date"
            value={fechaPedido}
            onChange={(e) => setFechaPedido(e.target.value)}
            disabled={isEditing}
          />
        </div>

        {/* Fecha entrega estimada */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Entrega Estimada</Label>
          <Input
            type="date"
            value={fechaEntregaEstimada}
            onChange={(e) => setFechaEntregaEstimada(e.target.value)}
          />
        </div>

        {/* Estado (only in edit mode) */}
        {isEditing && (
          <div>
            <Label className="text-sm font-medium text-marron mb-1 block">Estado</Label>
            <Select value={idEstado} onValueChange={setIdEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {estados.map((est) => (
                  <SelectItem key={est.id} value={est.id.toString()}>
                    {est.nombre_estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <Label className="text-sm font-medium text-marron mb-1 block">Observaciones</Label>
        <Textarea
          placeholder="Observaciones sobre el pedido..."
          className="resize-none"
          rows={2}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>

      {/* Detail rows - only in create mode, or show read-only in edit */}
      {!isEditing && (
        <>
          <Separator />
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-marron block">Detalle del Pedido</Label>

            {/* Table container with horizontal scroll on small screens */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[720px] space-y-3">
                {/* Column headers - aligned with data rows */}
                <div className="grid grid-cols-[1.5fr_3fr_1.2fr_1fr_1.3fr_44px] gap-3 px-3">
                  <div className="text-xs font-semibold text-muted-foreground">Tipo</div>
                  <div className="text-xs font-semibold text-muted-foreground">Producto</div>
                  <div className="text-xs font-semibold text-muted-foreground">Cantidad</div>
                  <div className="text-xs font-semibold text-muted-foreground">Unidad</div>
                  <div className="text-xs font-semibold text-muted-foreground">Precio Est.</div>
                  <div></div>
                </div>

                {/* Detail rows */}
                {detalles.map((detalle) => (
                  <div
                    key={detalle.key}
                    className="p-3 rounded-lg border border-marron/10 bg-muted/20"
                  >
                    <div className="grid grid-cols-[1.5fr_3fr_1.2fr_1fr_1.3fr_44px] gap-3 items-center">
                      {/* Tipo */}
                      <div>
                        <Label htmlFor={`tipo-${detalle.key}`} className="sr-only">Tipo</Label>
                        <Select
                          value={detalle.tipo}
                          onValueChange={(v) => updateDetalle(detalle.key, 'tipo', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp">Materia Prima</SelectItem>
                            <SelectItem value="insumo">Insumo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Producto */}
                      <div>
                        <Label htmlFor={`prod-${detalle.key}`} className="sr-only">Producto</Label>
                        <Select
                          value={detalle.id_producto}
                          onValueChange={(v) => updateDetalle(detalle.key, 'id_producto', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getProductsForTipo(detalle.tipo).map((prod) => (
                              <SelectItem key={prod.id} value={prod.id.toString()}>
                                {prod.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Cantidad */}
                      <div>
                        <Label htmlFor={`cant-${detalle.key}`} className="sr-only">Cantidad</Label>
                        <Input
                          id={`cant-${detalle.key}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="h-9"
                          value={detalle.cantidad}
                          onChange={(e) => updateDetalle(detalle.key, 'cantidad', e.target.value)}
                        />
                      </div>

                      {/* Unidad (auto-filled) */}
                      <div>
                        <Label htmlFor={`uni-${detalle.key}`} className="sr-only">Unidad</Label>
                        <Input
                          id={`uni-${detalle.key}`}
                          className="h-9 bg-muted/50"
                          value={detalle.unidadCodigo || '-'}
                          disabled
                        />
                      </div>

                      {/* Precio Estimado */}
                      <div>
                        <Label htmlFor={`precio-${detalle.key}`} className="sr-only">Precio Est.</Label>
                        <Input
                          id={`precio-${detalle.key}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="h-9"
                          value={detalle.precioEstimado}
                          onChange={(e) => updateDetalle(detalle.key, 'precioEstimado', e.target.value)}
                        />
                      </div>

                      {/* Delete */}
                      <div className="flex justify-center">
                        {detalles.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-rojo/10"
                            onClick={() => removeDetailRow(detalle.key)}
                            aria-label="Eliminar fila"
                          >
                            <Trash2 className="h-4 w-4 text-rojo" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add row button - clearly separated from the table */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDetailRow}
                className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar Fila
              </Button>
            </div>
          </div>

          {/* Total */}
          <Separator />
          <div className="flex justify-end">
            <div className="w-full sm:w-64">
              <div className="flex justify-between text-base font-bold">
                <span className="text-marron">Total Estimado</span>
                <span className="text-marron">{formatCurrency(totalEstimado)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit mode: show read-only detail summary */}
      {isEditing && pedido.detalle && pedido.detalle.length > 0 && (
        <>
          <Separator />
          <div>
            <Label className="text-sm font-semibold text-marron mb-2 block">
              Detalle del Pedido (solo lectura)
            </Label>
            <div className="rounded-lg border border-marron/10 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-medium">Producto</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Cantidad</th>
                    <th className="p-2 text-muted-foreground font-medium">Unidad</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Precio Est.</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalle.map((d: any) => (
                    <tr key={d.id} className="border-t border-marron/5">
                      <td className="p-2 text-marron">
                        {d.materiaPrima?.nombre || d.insumo?.nombre || '-'}
                      </td>
                      <td className="p-2 text-right">{d.cantidad_pedida}</td>
                      <td className="p-2 text-center text-muted-foreground">
                        {d.unidad?.codigo || '-'}
                      </td>
                      <td className="p-2 text-right">{formatCurrency(d.precio_estimado)}</td>
                      <td className="p-2 text-right font-medium text-marron">
                        {formatCurrency(d.cantidad_pedida * d.precio_estimado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <div className="w-full sm:w-64">
                <div className="flex justify-between font-bold text-marron">
                  <span>Total Estimado</span>
                  <span>{formatCurrency(pedido.total_estimado)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isEditing ? (
            'Guardar Cambios'
          ) : (
            'Registrar Pedido'
          )}
        </Button>
      </div>
    </div>
  )
}
