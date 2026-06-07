'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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

interface FormaPago {
  id: number
  nombre_forma: string
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

interface Marca {
  id: number
  nombre: string
}

interface DetalleRow {
  key: string
  tipo: 'mp' | 'insumo'
  id_producto: string
  id_marca: string
  cantidad: string
  unidad: string
  unidadCodigo: string
  precioUnitario: string
  precioTotal: string
  fechaVencimiento: string
  lote: string
}

interface CompraFormProps {
  compra?: any | null
  onSuccess: () => void
  onCancel: () => void
}

const IVA_RATE = 0.21

export default function CompraForm({ compra, onSuccess, onCancel }: CompraFormProps) {
  const isEditing = !!compra

  // Form fields
  const [idProveedor, setIdProveedor] = useState('')
  const [fechaCompra, setFechaCompra] = useState('')
  const [numeroFactura, setNumeroFactura] = useState('')
  const [idFormaPago, setIdFormaPago] = useState('')
  const [idEstado, setIdEstado] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Detail rows
  const [detalles, setDetalles] = useState<DetalleRow[]>([])

  // Data
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [estados, setEstados] = useState<EstadoGeneral[]>([])
  const [materiasPrimas, setMateriasPrimas] = useState<ProductoItem[]>([])
  const [insumos, setInsumos] = useState<ProductoItem[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Combobox open states
  const [proveedorOpen, setProveedorOpen] = useState(false)

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [provRes, fpRes, estRes, mpRes, insRes, marRes] = await Promise.all([
          fetch('/api/personas?tipo=proveedor&limite=100'),
          fetch('/api/formas-pago'),
          fetch('/api/estados-generales?entidad_aplicable=compra'),
          fetch('/api/materias-primas?limite=200&estado=true'),
          fetch('/api/insumos?limite=200&estado=true'),
          fetch('/api/marcas'),
        ])

        const provData = await provRes.json()
        const fpData = await fpRes.json()
        const estData = await estRes.json()
        const mpData = await mpRes.json()
        const insData = await insRes.json()
        const marData = await marRes.json()

        setProveedores(provData.personas || [])
        setFormasPago(Array.isArray(fpData) ? fpData : [])
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
        setMarcas(Array.isArray(marData) ? marData : [])
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
    if (compra) {
      setIdProveedor(compra.id_proveedor?.toString() || '')
      setFechaCompra(compra.fecha_compra ? compra.fecha_compra.split('T')[0] : '')
      setNumeroFactura(compra.numero_factura || '')
      setIdFormaPago(compra.id_forma_pago?.toString() || '')
      setIdEstado(compra.id_estado?.toString() || '')
      setObservaciones(compra.observaciones || '')

      if (compra.detalle && Array.isArray(compra.detalle)) {
        setDetalles(
          compra.detalle.map((d: any) => ({
            key: `row-${d.id}`,
            tipo: d.id_materia_prima ? 'mp' : 'insumo',
            id_producto: (d.id_materia_prima || d.id_insumo)?.toString() || '',
            id_marca: d.id_marca?.toString() || '',
            cantidad: d.cantidad_comprada?.toString() || '',
            unidad: d.unidadCompra?.id?.toString() || '',
            unidadCodigo: d.unidadCompra?.codigo || '',
            precioUnitario: d.precio_unitario?.toString() || '',
            precioTotal: d.precio_total?.toString() || '',
            fechaVencimiento: d.fecha_vencimiento ? d.fecha_vencimiento.split('T')[0] : '',
            lote: d.lote || '',
          }))
        )
      }
    } else {
      // Defaults for new
      setFechaCompra(new Date().toISOString().split('T')[0])
      addDetailRow()
    }
  }, [compra])

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
        id_marca: '',
        cantidad: '',
        unidad: '',
        unidadCodigo: '',
        precioUnitario: '',
        precioTotal: '',
        fechaVencimiento: '',
        lote: '',
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
          updated.precioUnitario = ''
          updated.precioTotal = ''
        }

        // When product changes, auto-fill unidad and precio_referencia
        if (field === 'id_producto' && value) {
          const product = findProduct(updated.tipo, value)
          if (product) {
            updated.unidad = product.unidadBase?.id?.toString() || ''
            updated.unidadCodigo = product.unidadBase?.codigo || ''
            updated.precioUnitario = product.precio_compra_referencia?.toString() || ''
          }
        }

        // Auto-calculate precio_total when cantidad or precio_unitario changes
        if (field === 'cantidad' || field === 'precioUnitario') {
          const cant = parseFloat(field === 'cantidad' ? value : updated.cantidad)
          const precio = parseFloat(field === 'precioUnitario' ? value : updated.precioUnitario)
          if (!isNaN(cant) && !isNaN(precio)) {
            updated.precioTotal = (cant * precio).toFixed(2)
          } else {
            updated.precioTotal = ''
          }
        }

        return updated
      })
    )
  }

  // Calculate totals
  const { subtotal, iva, total } = useMemo(() => {
    const sub = detalles.reduce((sum, d) => {
      const pt = parseFloat(d.precioTotal)
      return sum + (isNaN(pt) ? 0 : pt)
    }, 0)
    const ivaCalc = sub * IVA_RATE
    return {
      subtotal: sub,
      iva: ivaCalc,
      total: sub + ivaCalc,
    }
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
      if (!fechaCompra) {
        toast.error('Ingresá la fecha de compra')
        return
      }
      if (!idFormaPago) {
        toast.error('Seleccioná una forma de pago')
        return
      }
      if (detalles.length === 0) {
        toast.error('Agregá al menos un detalle de compra')
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
            id: compra.id,
            numero_factura: numeroFactura.trim() || null,
            observaciones: observaciones.trim() || null,
            id_estado: idEstado ? parseInt(idEstado) : undefined,
          }
        : {
            id_proveedor: parseInt(idProveedor),
            fecha_compra: fechaCompra,
            numero_factura: numeroFactura.trim() || null,
            id_forma_pago: parseInt(idFormaPago),
            observaciones: observaciones.trim() || null,
            subtotal,
            iva,
            total,
            detalles: detalles.map((d) => ({
              tipo: d.tipo === 'mp' ? 'materia_prima' : 'insumo',
              id_materia_prima: d.tipo === 'mp' ? parseInt(d.id_producto) : null,
              id_insumo: d.tipo === 'insumo' ? parseInt(d.id_producto) : null,
              id_marca: d.id_marca ? parseInt(d.id_marca) : null,
              cantidad_comprada: parseFloat(d.cantidad),
              id_unidad_compra: parseInt(d.unidad),
              precio_unitario: parseFloat(d.precioUnitario),
              fecha_vencimiento: d.fechaVencimiento || null,
              lote: d.lote.trim() || null,
            })),
          }

      const url = isEditing ? `/api/compras/${compra.id}` : '/api/compras'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar compra')
      }

      toast.success(isEditing ? 'Compra actualizada' : 'Compra registrada', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'La nueva compra se registró exitosamente',
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
            Compra #{compra.id} — Proveedor: {compra.proveedor?.razon_social || `${compra.proveedor?.nombre} ${compra.proveedor?.apellido}`}
          </p>
        </div>
      )}

      {/* Main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Proveedor - searchable combobox (only in create mode) */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Proveedor *</Label>
          {isEditing ? (
            <Input
              value={compra.proveedor?.razon_social || `${compra.proveedor?.nombre} ${compra.proveedor?.apellido}`}
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

        {/* Fecha compra */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Fecha Compra *</Label>
          <Input
            type="date"
            value={fechaCompra}
            onChange={(e) => setFechaCompra(e.target.value)}
            disabled={isEditing}
          />
        </div>

        {/* Numero factura */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Nº Factura</Label>
          <Input
            placeholder="Ej: 0001-12345678"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
          />
        </div>

        {/* Forma pago */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Forma de Pago *</Label>
          {isEditing ? (
            <Input
              value={compra.formaPago?.nombre_forma || ''}
              disabled
              className="bg-muted/50"
            />
          ) : (
            <Select value={idFormaPago} onValueChange={setIdFormaPago}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {formasPago.map((fp) => (
                  <SelectItem key={fp.id} value={fp.id.toString()}>
                    {fp.nombre_forma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          placeholder="Observaciones sobre la compra..."
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
              <Label className="text-sm font-semibold text-marron">Detalle de Compra</Label>
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

            {/* Professional table layout */}
            <div className="rounded-lg border border-marron/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/50 border-b border-marron/10">
                    <tr>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[120px]">Tipo</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground">Producto</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[130px]">Marca</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[100px]">Cantidad</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[80px]">Unidad</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[120px]">Precio Unit.</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[120px]">Precio Total</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[140px]">F. Vencimiento</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground w-[100px]">Lote</th>
                      <th className="w-[44px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((detalle, index) => (
                      <tr key={detalle.key} className="border-b border-marron/5 hover:bg-muted/10">
                        {/* Tipo */}
                        <td className="p-2">
                          <Select
                            value={detalle.tipo}
                            onValueChange={(v) => updateDetalle(detalle.key, 'tipo', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mp">Materia Prima</SelectItem>
                              <SelectItem value="insumo">Insumo</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Producto */}
                        <td className="p-2">
                          <Select
                            value={detalle.id_producto}
                            onValueChange={(v) => updateDetalle(detalle.key, 'id_producto', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
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
                        </td>

                        {/* Marca */}
                        <td className="p-2">
                          <Select
                            value={detalle.id_marca}
                            onValueChange={(v) => updateDetalle(detalle.key, 'id_marca', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin marca</SelectItem>
                              {marcas.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                  {m.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Cantidad */}
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            className="h-8 text-xs"
                            value={detalle.cantidad}
                            onChange={(e) => updateDetalle(detalle.key, 'cantidad', e.target.value)}
                          />
                        </td>

                        {/* Unidad */}
                        <td className="p-2">
                          <Input
                            className="h-8 text-xs bg-muted/50"
                            value={detalle.unidadCodigo || '-'}
                            disabled
                          />
                        </td>

                        {/* Precio Unitario */}
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="h-8 text-xs"
                            value={detalle.precioUnitario}
                            onChange={(e) => updateDetalle(detalle.key, 'precioUnitario', e.target.value)}
                          />
                        </td>

                        {/* Precio Total */}
                        <td className="p-2">
                          <Input
                            className="h-8 text-xs bg-muted/50 font-semibold"
                            value={detalle.precioTotal ? formatCurrency(parseFloat(detalle.precioTotal)) : ''}
                            disabled
                          />
                        </td>

                        {/* Fecha Vencimiento */}
                        <td className="p-2">
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={detalle.fechaVencimiento}
                            onChange={(e) => updateDetalle(detalle.key, 'fechaVencimiento', e.target.value)}
                          />
                        </td>

                        {/* Lote */}
                        <td className="p-2">
                          <Input
                            placeholder="Opcional"
                            className="h-8 text-xs"
                            value={detalle.lote}
                            onChange={(e) => updateDetalle(detalle.key, 'lote', e.target.value)}
                          />
                        </td>

                        {/* Delete */}
                        <td className="p-2">
                          {detalles.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-rojo/10"
                              onClick={() => removeDetailRow(detalle.key)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rojo" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totals */}
          <Separator />
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-marron">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (21%)</span>
                <span className="font-medium text-marron">{formatCurrency(iva)}</span>
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
      {isEditing && compra.detalle && compra.detalle.length > 0 && (
        <>
          <Separator />
          <div>
            <Label className="text-sm font-semibold text-marron mb-2 block">
              Detalle de la Compra (solo lectura)
            </Label>
            <div className="rounded-lg border border-marron/10 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-medium">Producto</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Cantidad</th>
                    <th className="p-2 text-muted-foreground font-medium">Unidad</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">P. Unit.</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">P. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.detalle.map((d: any) => (
                    <tr key={d.id} className="border-t border-marron/5">
                      <td className="p-2 text-marron">
                        {d.materiaPrima?.nombre || d.insumo?.nombre || '-'}
                        {d.marca && (
                          <Badge variant="outline" className="ml-2 text-xs border-marron/20 text-marron">
                            {d.marca.nombre}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-right">{d.cantidad_comprada}</td>
                      <td className="p-2 text-center text-muted-foreground">
                        {d.unidadCompra?.codigo || '-'}
                      </td>
                      <td className="p-2 text-right">{formatCurrency(d.precio_unitario)}</td>
                      <td className="p-2 text-right font-medium text-marron">
                        {formatCurrency(d.precio_total)}
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
                  <span>{formatCurrency(compra.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA</span>
                  <span>{formatCurrency(compra.iva)}</span>
                </div>
                <div className="flex justify-between font-bold text-marron">
                  <span>Total</span>
                  <span>{formatCurrency(compra.total)}</span>
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
            'Registrar Compra'
          )}
        </Button>
      </div>
    </div>
  )
}
