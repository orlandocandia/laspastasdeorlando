'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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

interface Cliente {
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

interface ProductoTerminado {
  id: number
  nombre: string
  precio_venta: number
}

interface DetalleRow {
  key: string
  idProductoTerminado: string
  cantidad: string
  precioUnitario: string
  subtotal: string
}

interface PedidoClienteFormProps {
  pedido?: any | null
  onSuccess: () => void
  onCancel: () => void
}

export default function PedidoClienteForm({ pedido, onSuccess, onCancel }: PedidoClienteFormProps) {
  const isEditing = !!pedido

  // Form fields
  const [idCliente, setIdCliente] = useState('')
  const [fechaEntregaSolicitada, setFechaEntregaSolicitada] = useState('')
  const [fechaEntregaReal, setFechaEntregaReal] = useState('')
  const [senia, setSenia] = useState('')
  const [idEstado, setIdEstado] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Detail rows
  const [detalles, setDetalles] = useState<DetalleRow[]>([])

  // Data
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [estados, setEstados] = useState<EstadoGeneral[]>([])
  const [productosTerminados, setProductosTerminados] = useState<ProductoTerminado[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Combobox open states
  const [clienteOpen, setClienteOpen] = useState(false)

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [cliRes, estRes, ptRes] = await Promise.all([
          fetch('/api/personas?tipo=cliente&limite=100'),
          fetch('/api/estados-generales?entidad_aplicable=pedido_cliente'),
          fetch('/api/productos-terminados?limite=200&estado=true'),
        ])

        const cliData = await cliRes.json()
        const estData = await estRes.json()
        const ptData = await ptRes.json()

        setClientes(cliData.personas || [])
        setEstados(Array.isArray(estData) ? estData : [])
        setProductosTerminados(
          (ptData.data || []).map((pt: any) => ({
            id: pt.id,
            nombre: pt.nombre,
            precio_venta: pt.precio_venta,
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
      setIdCliente(pedido.id_cliente?.toString() || '')
      setFechaEntregaSolicitada(
        pedido.fecha_entrega_solicitada ? pedido.fecha_entrega_solicitada.split('T')[0] : ''
      )
      setFechaEntregaReal(
        pedido.fecha_entrega_real ? pedido.fecha_entrega_real.split('T')[0] : ''
      )
      setSenia(pedido.senia?.toString() || '')
      setIdEstado(pedido.id_estado?.toString() || '')
      setObservaciones(pedido.observaciones || '')

      if (pedido.detalle && Array.isArray(pedido.detalle)) {
        setDetalles(
          pedido.detalle.map((d: any) => ({
            key: `row-${d.id}`,
            idProductoTerminado: d.id_producto_terminado?.toString() || '',
            cantidad: d.cantidad?.toString() || '',
            precioUnitario: d.precio_unitario?.toString() || '',
            subtotal: d.subtotal?.toString() || '',
          }))
        )
      }
    } else {
      // Defaults for new
      addDetailRow()
    }
  }, [pedido])

  // Find product by id
  const findProducto = (id: string) => {
    return productosTerminados.find((p) => p.id.toString() === id)
  }

  // Add detail row
  const addDetailRow = () => {
    setDetalles((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        idProductoTerminado: '',
        cantidad: '',
        precioUnitario: '',
        subtotal: '',
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

        // When product changes, auto-fill precio_venta
        if (field === 'idProductoTerminado' && value) {
          const product = findProducto(value)
          if (product) {
            updated.precioUnitario = product.precio_venta?.toString() || ''
          }
        }

        // Auto-calculate subtotal when cantidad or precio_unitario changes
        if (field === 'cantidad' || field === 'precioUnitario') {
          const cant = parseFloat(field === 'cantidad' ? value : updated.cantidad)
          const precio = parseFloat(field === 'precioUnitario' ? value : updated.precioUnitario)
          if (!isNaN(cant) && !isNaN(precio)) {
            updated.subtotal = (cant * precio).toFixed(2)
          } else {
            updated.subtotal = ''
          }
        }

        return updated
      })
    )
  }

  // Calculate totals
  const { subtotal, total } = useMemo(() => {
    const sub = detalles.reduce((sum, d) => {
      const st = parseFloat(d.subtotal)
      return sum + (isNaN(st) ? 0 : st)
    }, 0)
    return {
      subtotal: sub,
      total: sub,
    }
  }, [detalles])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!isEditing) {
      if (!idCliente) {
        toast.error('Seleccioná un cliente')
        return
      }
      if (!fechaEntregaSolicitada) {
        toast.error('Ingresá la fecha de entrega solicitada')
        return
      }
      if (detalles.length === 0) {
        toast.error('Agregá al menos un detalle al pedido')
        return
      }
      for (let i = 0; i < detalles.length; i++) {
        const d = detalles[i]
        if (!d.idProductoTerminado) {
          toast.error(`Fila ${i + 1}: Seleccioná un producto terminado`)
          return
        }
        if (!d.cantidad || parseFloat(d.cantidad) <= 0) {
          toast.error(`Fila ${i + 1}: Ingresá una cantidad válida`)
          return
        }
        if (!d.precioUnitario || parseFloat(d.precioUnitario) <= 0) {
          toast.error(`Fila ${i + 1}: Ingresá un precio unitario válido`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const payload = isEditing
        ? {
            id: pedido.id,
            fecha_entrega_solicitada: fechaEntregaSolicitada || undefined,
            fecha_entrega_real: fechaEntregaReal || null,
            senia: senia ? parseFloat(senia) : 0,
            id_estado: idEstado ? parseInt(idEstado) : undefined,
            observaciones: observaciones.trim() || null,
          }
        : {
            id_cliente: parseInt(idCliente),
            fecha_entrega_solicitada: fechaEntregaSolicitada,
            senia: senia ? parseFloat(senia) : 0,
            observaciones: observaciones.trim() || null,
            subtotal,
            total,
            detalle: detalles.map((d) => ({
              id_producto_terminado: parseInt(d.idProductoTerminado),
              cantidad: parseFloat(d.cantidad),
              precio_unitario: parseFloat(d.precioUnitario),
              subtotal: parseFloat(d.subtotal),
            })),
          }

      const url = isEditing ? `/api/pedidos-clientes/${pedido.id}` : '/api/pedidos-clientes'
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
            Pedido #{pedido.id} — Cliente: {pedido.cliente?.razon_social || `${pedido.cliente?.nombre} ${pedido.cliente?.apellido}`}
          </p>
        </div>
      )}

      {/* Main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cliente - searchable combobox */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Cliente *</Label>
          {isEditing ? (
            <Input
              value={pedido.cliente?.razon_social || `${pedido.cliente?.nombre} ${pedido.cliente?.apellido}`}
              disabled
              className="bg-muted/50"
            />
          ) : (
            <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clienteOpen}
                  className={cn(
                    'w-full justify-between',
                    !idCliente && 'text-muted-foreground'
                  )}
                >
                  {idCliente
                    ? (() => {
                        const cli = clientes.find((c) => c.id.toString() === idCliente)
                        return cli?.razon_social || `${cli?.nombre} ${cli?.apellido}` || 'Seleccionar...'
                      })()
                    : 'Buscar cliente...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>No se encontró cliente</CommandEmpty>
                    <CommandGroup>
                      {clientes.map((cli) => (
                        <CommandItem
                          key={cli.id}
                          value={cli.razon_social || `${cli.nombre} ${cli.apellido}`}
                          onSelect={() => {
                            setIdCliente(cli.id.toString())
                            setClienteOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              idCliente === cli.id.toString() ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {cli.razon_social || `${cli.nombre} ${cli.apellido}`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Fecha entrega solicitada */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Fecha Entrega Solicitada *</Label>
          <Input
            type="date"
            value={fechaEntregaSolicitada}
            onChange={(e) => setFechaEntregaSolicitada(e.target.value)}
          />
        </div>

        {/* Seña */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Seña</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={senia}
            onChange={(e) => setSenia(e.target.value)}
          />
        </div>

        {/* Fecha entrega real (only in edit mode) */}
        {isEditing && (
          <div>
            <Label className="text-sm font-medium text-marron mb-1 block">Fecha Entrega Real</Label>
            <Input
              type="date"
              value={fechaEntregaReal}
              onChange={(e) => setFechaEntregaReal(e.target.value)}
            />
          </div>
        )}

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
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-marron">Detalle del Pedido</Label>
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

            <div className="space-y-3">
              {detalles.map((detalle, index) => (
                <div
                  key={detalle.key}
                  className="p-3 rounded-lg border border-marron/10 bg-muted/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Fila {index + 1}
                    </span>
                    {detalles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-rojo/10"
                        onClick={() => removeDetailRow(detalle.key)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rojo" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Producto Terminado */}
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Producto Terminado</Label>
                      <Select
                        value={detalle.idProductoTerminado}
                        onValueChange={(v) => updateDetalle(detalle.key, 'idProductoTerminado', v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productosTerminados.map((pt) => (
                            <SelectItem key={pt.id} value={pt.id.toString()}>
                              {pt.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cantidad */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Cantidad</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        className="h-9"
                        value={detalle.cantidad}
                        onChange={(e) => updateDetalle(detalle.key, 'cantidad', e.target.value)}
                      />
                    </div>

                    {/* Precio Unitario */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Precio Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-9"
                        value={detalle.precioUnitario}
                        onChange={(e) => updateDetalle(detalle.key, 'precioUnitario', e.target.value)}
                      />
                    </div>

                    {/* Subtotal (auto-calculated) */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Subtotal</Label>
                      <Input
                        className="h-9 bg-muted/50 font-semibold"
                        value={detalle.subtotal ? formatCurrency(parseFloat(detalle.subtotal)) : ''}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <Separator />
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-marron">{formatCurrency(subtotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span className="text-marron">Total</span>
                <span className="text-marron">{formatCurrency(total)}</span>
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
                    <th className="text-right p-2 text-muted-foreground font-medium">P. Unit.</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalle.map((d: any) => (
                    <tr key={d.id} className="border-t border-marron/5">
                      <td className="p-2 text-marron">
                        {d.productoTerminado?.nombre || '-'}
                      </td>
                      <td className="p-2 text-right">{d.cantidad}</td>
                      <td className="p-2 text-right">{formatCurrency(d.precio_unitario)}</td>
                      <td className="p-2 text-right font-medium text-marron">
                        {formatCurrency(d.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <div className="w-64 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(pedido.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seña</span>
                  <span>{formatCurrency(pedido.senia)}</span>
                </div>
                <div className="flex justify-between font-bold text-marron">
                  <span>Total</span>
                  <span>{formatCurrency(pedido.total)}</span>
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
