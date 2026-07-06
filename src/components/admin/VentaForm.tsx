'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Check, ChevronsUpDown, ScanBarcode } from 'lucide-react'

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

interface FormaPago {
  id: number
  nombre_forma: string
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

interface Vendedor {
  id: number
  persona: { nombre: string; apellido: string }
}

interface PedidoPendiente {
  id: number
  fecha_pedido: string
  cliente: { id: number; nombre: string; apellido: string; razon_social: string | null }
  detalle: { id: number; id_producto_terminado: number; cantidad: number; precio_unitario: number; productoTerminado: { id: number; nombre: string; precio_venta: number } }[]
  total: number
}

interface DetalleRow {
  key: string
  idProductoTerminado: string
  cantidad: string
  precioUnitario: string
  subtotal: string
  // Snapshot del descuento por volumen aplicado (strings para coincidir con el resto de la fila)
  descuentoVolumenId?: string
  descuentoVolumenValor?: string
  descuentoVolumenTipo?: string  // "porcentaje" | "fijo"
  precioUnitarioOriginal?: string
  descuentoUnitario?: string
  descuentoNombre?: string
}

interface VentaFormProps {
  venta?: any | null
  fromPedido?: boolean
  onSuccess: () => void
  onCancel: () => void
}

const IVA_RATE = 0.21

export default function VentaForm({ venta, fromPedido, onSuccess, onCancel }: VentaFormProps) {
  const isEditing = !!venta

  // Form fields
  const [idCliente, setIdCliente] = useState('')
  const [fechaVenta, setFechaVenta] = useState('')
  const [idFormaPago, setIdFormaPago] = useState('')
  const [idVendedor, setIdVendedor] = useState('')
  const [numeroComprobante, setNumeroComprobante] = useState('')
  const [idEstado, setIdEstado] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [idPedido, setIdPedido] = useState('')

  // Detail rows
  const [detalles, setDetalles] = useState<DetalleRow[]>([])

  // Data
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [estados, setEstados] = useState<EstadoGeneral[]>([])
  const [productosTerminados, setProductosTerminados] = useState<ProductoTerminado[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendiente[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Barcode scanner ref
  const codigoBarrasRef = useRef<HTMLInputElement>(null)

  // Combobox open states
  const [clienteOpen, setClienteOpen] = useState(false)
  const [pedidoOpen, setPedidoOpen] = useState(false)

  // Descuento por volumen — guard anti-race-condition y debounce por fila
  const recalcSeqRef = useRef<Map<string, number>>(new Map())
  const recalcTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Recalcular descuento por volumen para una fila (consulta a la API)
  const recalcularDescuento = useCallback(async (key: string, idProducto: string, cantidad: string) => {
    const seq = (recalcSeqRef.current.get(key) ?? 0) + 1
    recalcSeqRef.current.set(key, seq)

    const cantNum = parseFloat(cantidad)
    // Sin producto o cantidad inválida → limpiar descuento y volver al precio original
    if (!idProducto || !cantidad || isNaN(cantNum) || cantNum <= 0) {
      setDetalles(prev => prev.map(d => {
        if (d.key !== key) return d
        if (recalcSeqRef.current.get(key) !== seq) return d
        const product = productosTerminados.find(p => p.id.toString() === d.idProductoTerminado)
        const precioOriginal = product?.precio_venta?.toString() || d.precioUnitario
        const cant = parseFloat(d.cantidad)
        const precio = parseFloat(precioOriginal)
        return {
          ...d,
          precioUnitario: precioOriginal,
          precioUnitarioOriginal: undefined,
          descuentoUnitario: undefined,
          descuentoVolumenId: undefined,
          descuentoVolumenValor: undefined,
          descuentoVolumenTipo: undefined,
          descuentoNombre: undefined,
          subtotal: (!isNaN(cant) && !isNaN(precio)) ? (cant * precio).toFixed(2) : '',
        }
      }))
      return
    }

    try {
      const res = await fetch(`/api/descuentos-volumen/calcular?producto_id=${encodeURIComponent(idProducto)}&cantidad=${encodeURIComponent(cantidad)}`)
      if (!res.ok) return
      const data = await res.json()

      // Guard anti-race: si otra request más nueva llegó, ignorar este resultado
      if (recalcSeqRef.current.get(key) !== seq) return

      setDetalles(prev => prev.map(d => {
        if (d.key !== key) return d
        // Si el usuario cambió la fila mientras esperábamos la API, no pisar
        if (d.idProductoTerminado !== idProducto || d.cantidad !== cantidad) return d

        const cant = parseFloat(d.cantidad)
        if (data.descuento && data.precio_final != null) {
          const precioFinal = data.precio_final
          return {
            ...d,
            precioUnitario: precioFinal.toString(),
            precioUnitarioOriginal: data.precio_original?.toString() || undefined,
            descuentoUnitario: data.descuento_aplicado?.toString() || undefined,
            descuentoVolumenId: data.descuento.id?.toString() || undefined,
            descuentoVolumenValor: data.descuento.valor?.toString() || undefined,
            descuentoVolumenTipo: data.descuento.tipo_descuento || undefined,
            descuentoNombre: data.descuento.nombre || undefined,
            subtotal: !isNaN(cant) ? (cant * precioFinal).toFixed(2) : '',
          }
        } else {
          // Sin descuento → volver al precio original del producto
          const precioOriginal = data.precio_original?.toString() || d.precioUnitario
          const precio = parseFloat(precioOriginal)
          return {
            ...d,
            precioUnitario: precioOriginal,
            precioUnitarioOriginal: undefined,
            descuentoUnitario: undefined,
            descuentoVolumenId: undefined,
            descuentoVolumenValor: undefined,
            descuentoVolumenTipo: undefined,
            descuentoNombre: undefined,
            subtotal: (!isNaN(cant) && !isNaN(precio)) ? (cant * precio).toFixed(2) : '',
          }
        }
      }))
    } catch {
      // Best-effort: si falla el cálculo, el formulario sigue funcionando sin descuento
    }
  }, [productosTerminados])

  // Programar recálculo con debounce (350ms) para no spammear la API en cada keystroke
  const programarRecalcDescuento = useCallback((key: string, idProducto: string, cantidad: string) => {
    const existing = recalcTimersRef.current.get(key)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      recalcTimersRef.current.delete(key)
      void recalcularDescuento(key, idProducto, cantidad)
    }, 350)
    recalcTimersRef.current.set(key, timer)
  }, [recalcularDescuento])

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [cliRes, fpRes, estRes, ptRes, venRes, pedRes] = await Promise.all([
          fetch('/api/personas?tipo=cliente&limite=100'),
          fetch('/api/formas-pago'),
          fetch('/api/estados-generales?entidad_aplicable=venta'),
          fetch('/api/productos-terminados?limite=200&estado=true'),
          fetch('/api/usuarios'),
          fromPedido
            ? fetch('/api/pedidos-clientes?limite=100&id_estado=pendiente')
            : Promise.resolve(new Response('[]', { status: 200 })),
        ])

        const cliData = await cliRes.json()
        const fpData = await fpRes.json()
        const estData = await estRes.json()
        const ptData = await ptRes.json()
        const venData = await venRes.json()
        const pedData = await pedRes.json()

        setClientes(cliData.personas || [])
        setFormasPago(Array.isArray(fpData) ? fpData : [])
        setEstados(Array.isArray(estData) ? estData : [])
        setProductosTerminados(
          (ptData.data || []).map((pt: any) => ({
            id: pt.id,
            nombre: pt.nombre,
            precio_venta: pt.precio_venta,
          }))
        )
        setVendedores(venData.usuarios || venData || [])
        if (fromPedido) {
          setPedidosPendientes(pedData.data || [])
        }
      } catch {
        toast.error('Error al cargar datos del formulario')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [fromPedido])

  // Populate form when editing
  useEffect(() => {
    if (venta) {
      setIdCliente(venta.id_cliente?.toString() || '')
      setFechaVenta(venta.fecha_venta ? venta.fecha_venta.split('T')[0] : '')
      setIdFormaPago(venta.id_forma_pago?.toString() || '')
      setIdVendedor(venta.id_vendedor?.toString() || '')
      setNumeroComprobante(venta.numero_comprobante || '')
      setIdEstado(venta.id_estado?.toString() || '')
      setObservaciones(venta.observaciones || '')
      setIdPedido(venta.id_pedido?.toString() || '')

      if (venta.detalle && Array.isArray(venta.detalle)) {
        setDetalles(
          venta.detalle.map((d: any) => ({
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
      setFechaVenta(new Date().toISOString().split('T')[0])
      addDetailRow()
    }
  }, [venta])

  // Handle pedido selection (fromPedido mode)
  const handlePedidoSelect = (pedidoId: string) => {
    setIdPedido(pedidoId)
    const pedido = pedidosPendientes.find((p) => p.id.toString() === pedidoId)
    if (pedido) {
      setIdCliente(pedido.cliente?.id?.toString() || '')
      const nuevasFilas: DetalleRow[] = pedido.detalle.map((d: any) => ({
        key: `row-${d.id || Date.now() + Math.random()}`,
        idProductoTerminado: d.id_producto_terminado?.toString() || '',
        cantidad: d.cantidad?.toString() || '',
        precioUnitario: d.precio_unitario?.toString() || d.productoTerminado?.precio_venta?.toString() || '',
        subtotal: (d.cantidad * (d.precio_unitario || d.productoTerminado?.precio_venta || 0)).toFixed(2),
      }))
      setDetalles(nuevasFilas)
      // Disparar recálculo de descuento por volumen para cada fila cargada
      nuevasFilas.forEach(fila => {
        if (fila.idProductoTerminado && fila.cantidad) {
          programarRecalcDescuento(fila.key, fila.idProductoTerminado, fila.cantidad)
        }
      })
    }
  }

  // Find product by id
  const findProducto = (id: string) => {
    return productosTerminados.find((p) => p.id.toString() === id)
  }

  // Search product by barcode
  const buscarProductoPorCodigo = async (codigo: string) => {
    if (!codigo.trim()) return
    try {
      const res = await fetch(`/api/productos-terminados/buscar-por-codigo?codigo=${encodeURIComponent(codigo.trim())}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error('Producto no encontrado')
        return
      }

      if (data.multiples) {
        toast.error('Múltiples productos coinciden, use búsqueda manual')
        return
      }

      // Check if product already in detail rows
      const existingIndex = detalles.findIndex(d => d.idProductoTerminado === data.id.toString())
      if (existingIndex >= 0) {
        // Increment quantity
        const newDetalles = [...detalles]
        const existing = newDetalles[existingIndex]
        const newCantidad = (parseFloat(existing.cantidad) || 0) + 1
        newDetalles[existingIndex] = {
          ...existing,
          cantidad: newCantidad.toString(),
        }
        newDetalles[existingIndex].subtotal = (newCantidad * parseFloat(existing.precioUnitario)).toFixed(2)
        setDetalles(newDetalles)
        toast.success(`${data.nombre} - cantidad actualizada`)
        // Recalcular descuento por volumen con la nueva cantidad
        programarRecalcDescuento(existing.key, existing.idProductoTerminado, newCantidad.toString())
      } else {
        // Add new row
        const newKey = `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        setDetalles(prev => [...prev, {
          key: newKey,
          idProductoTerminado: data.id.toString(),
          cantidad: '1',
          precioUnitario: data.precio_venta?.toString() || '',
          subtotal: data.precio_venta?.toString() || '',
        }])
        toast.success(`${data.nombre} agregado`)
        // Recalcular descuento por volumen (cantidad = 1)
        programarRecalcDescuento(newKey, data.id.toString(), '1')
      }

      // Clear and refocus
      if (codigoBarrasRef.current) {
        codigoBarrasRef.current.value = ''
        codigoBarrasRef.current.focus()
      }
    } catch {
      toast.error('Error al buscar producto')
    }
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
    const currentRow = detalles.find(d => d.key === key)
    if (!currentRow) return

    // Calcular valores post-cambio para programar el recálculo
    let newIdProducto = currentRow.idProductoTerminado
    let newCantidad = currentRow.cantidad
    let newPrecio = currentRow.precioUnitario

    if (field === 'idProductoTerminado') {
      newIdProducto = value
      const product = findProducto(value)
      if (product) newPrecio = product.precio_venta?.toString() || ''
    } else if (field === 'cantidad') {
      newCantidad = value
    } else if (field === 'precioUnitario') {
      newPrecio = value
    }

    // Edición manual de precio → el usuario overridea, limpiar descuento
    if (field === 'precioUnitario') {
      setDetalles(prev => prev.map(d => {
        if (d.key !== key) return d
        const cant = parseFloat(newCantidad)
        const precio = parseFloat(value)
        return {
          ...d,
          precioUnitario: value,
          precioUnitarioOriginal: undefined,
          descuentoUnitario: undefined,
          descuentoVolumenId: undefined,
          descuentoVolumenValor: undefined,
          descuentoVolumenTipo: undefined,
          descuentoNombre: undefined,
          subtotal: (!isNaN(cant) && !isNaN(precio)) ? (cant * precio).toFixed(2) : '',
        }
      }))
      return
    }

    // Cambio de producto o cantidad → actualizar y programar recálculo de descuento
    setDetalles(prev => prev.map(d => {
      if (d.key !== key) return d
      const updated: DetalleRow = { ...d, [field]: value }
      if (field === 'idProductoTerminado') {
        updated.precioUnitario = newPrecio
        // Limpiar descuento anterior (el recálculo lo volverá a aplicar si corresponde)
        updated.precioUnitarioOriginal = undefined
        updated.descuentoUnitario = undefined
        updated.descuentoVolumenId = undefined
        updated.descuentoVolumenValor = undefined
        updated.descuentoVolumenTipo = undefined
        updated.descuentoNombre = undefined
      }
      const cant = parseFloat(newCantidad)
      const precio = parseFloat(newPrecio)
      updated.subtotal = (!isNaN(cant) && !isNaN(precio)) ? (cant * precio).toFixed(2) : ''
      return updated
    }))

    // Programar recálculo de descuento por volumen (debounced)
    programarRecalcDescuento(key, newIdProducto, newCantidad)
  }

  // Calculate totals
  const { subtotal, iva, total } = useMemo(() => {
    const sub = detalles.reduce((sum, d) => {
      const st = parseFloat(d.subtotal)
      return sum + (isNaN(st) ? 0 : st)
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
      if (!idCliente) {
        toast.error('Seleccioná un cliente')
        return
      }
      if (!fechaVenta) {
        toast.error('Ingresá la fecha de venta')
        return
      }
      if (!idFormaPago) {
        toast.error('Seleccioná una forma de pago')
        return
      }
      if (!idVendedor) {
        toast.error('Seleccioná un vendedor')
        return
      }
      if (detalles.length === 0) {
        toast.error('Agregá al menos un detalle a la venta')
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
            id: venta.id,
            numero_comprobante: numeroComprobante.trim() || null,
            id_estado: idEstado ? parseInt(idEstado) : undefined,
            observaciones: observaciones.trim() || null,
          }
        : {
            id_cliente: parseInt(idCliente),
            id_vendedor: parseInt(idVendedor),
            id_forma_pago: parseInt(idFormaPago),
            id_pedido: idPedido ? parseInt(idPedido) : null,
            numero_comprobante: numeroComprobante.trim() || null,
            fecha_venta: fechaVenta,
            subtotal,
            iva,
            total,
            observaciones: observaciones.trim() || null,
            detalles: detalles.map((d) => ({
              id_producto_terminado: parseInt(d.idProductoTerminado),
              cantidad: parseFloat(d.cantidad),
              precio_unitario: parseFloat(d.precioUnitario),
              subtotal: parseFloat(d.subtotal),
              descuento_volumen_id: d.descuentoVolumenId ? parseInt(d.descuentoVolumenId) : null,
              descuento_volumen_valor: d.descuentoVolumenValor ? parseFloat(d.descuentoVolumenValor) : null,
              descuento_volumen_tipo: d.descuentoVolumenTipo || null,
              precio_unitario_original: d.precioUnitarioOriginal ? parseFloat(d.precioUnitarioOriginal) : null,
              descuento_unitario: d.descuentoUnitario ? parseFloat(d.descuentoUnitario) : null,
              descuento_nombre: d.descuentoNombre || null,
            })),
          }

      const url = isEditing ? `/api/ventas/${venta.id}` : '/api/ventas'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar venta')
      }

      toast.success(isEditing ? 'Venta actualizada' : 'Venta registrada', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'La nueva venta se registró exitosamente',
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
            Venta #{venta.id} — Cliente: {venta.cliente?.razon_social || `${venta.cliente?.nombre} ${venta.cliente?.apellido}`}
          </p>
        </div>
      )}

      {/* From Pedido selector */}
      {fromPedido && (
        <div className="bg-mostaza/5 rounded-lg p-3 border border-mostaza/20">
          <Label className="text-sm font-medium text-marron mb-1 block">Seleccionar Pedido Pendiente *</Label>
          <Popover open={pedidoOpen} onOpenChange={setPedidoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={pedidoOpen}
                className={cn(
                  'w-full justify-between',
                  !idPedido && 'text-muted-foreground'
                )}
              >
                {idPedido
                  ? (() => {
                      const ped = pedidosPendientes.find((p) => p.id.toString() === idPedido)
                      return ped
                        ? `Pedido #${ped.id} — ${ped.cliente?.razon_social || `${ped.cliente?.nombre} ${ped.cliente?.apellido}`}`
                        : 'Seleccionar...'
                    })()
                  : 'Buscar pedido pendiente...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar pedido..." />
                <CommandList>
                  <CommandEmpty>No se encontró pedido</CommandEmpty>
                  <CommandGroup>
                    {pedidosPendientes.map((ped) => (
                      <CommandItem
                        key={ped.id}
                        value={`pedido-${ped.id}`}
                        onSelect={() => {
                          handlePedidoSelect(ped.id.toString())
                          setPedidoOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            idPedido === ped.id.toString() ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Pedido #{ped.id} — {ped.cliente?.razon_social || `${ped.cliente?.nombre} ${ped.cliente?.apellido}`}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cliente - searchable combobox */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Cliente *</Label>
          {isEditing || fromPedido ? (
            <Input
              value={
                idCliente
                  ? (() => {
                      const cli = clientes.find((c) => c.id.toString() === idCliente)
                      return cli?.razon_social || `${cli?.nombre} ${cli?.apellido}` || ''
                    })()
                  : ''
              }
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

        {/* Fecha venta */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Fecha Venta *</Label>
          <Input
            type="date"
            value={fechaVenta}
            onChange={(e) => setFechaVenta(e.target.value)}
            disabled={isEditing}
          />
        </div>

        {/* Forma de pago */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Forma de Pago *</Label>
          {isEditing ? (
            <Input
              value={venta.formaPago?.nombre_forma || ''}
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

        {/* Vendedor */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Vendedor *</Label>
          {isEditing ? (
            <Input
              value={`${venta.vendedor?.persona?.nombre || ''} ${venta.vendedor?.persona?.apellido || ''}`}
              disabled
              className="bg-muted/50"
            />
          ) : (
            <Select value={idVendedor} onValueChange={setIdVendedor}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.persona?.nombre} {v.persona?.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Numero comprobante */}
        {!isEditing && (
          <div>
            <Label className="text-sm font-medium text-marron mb-1 block">Nº Comprobante</Label>
            <Input
              placeholder="Ej: 0001-12345678"
              value={numeroComprobante}
              onChange={(e) => setNumeroComprobante(e.target.value)}
            />
          </div>
        )}

        {/* Estado (only in edit mode) */}
        {isEditing && (
          <>
            <div>
              <Label className="text-sm font-medium text-marron mb-1 block">Nº Comprobante</Label>
              <Input
                placeholder="Ej: 0001-12345678"
                value={numeroComprobante}
                onChange={(e) => setNumeroComprobante(e.target.value)}
              />
            </div>
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
          </>
        )}
      </div>

      {/* Barcode scanner input - only in create mode */}
      {!venta && (
        <div className="mb-4">
          <div className="relative">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={codigoBarrasRef}
              type="text"
              placeholder="Escanear código de barras o buscar producto..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-mostaza focus:border-mostaza text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  buscarProductoPorCodigo((e.target as HTMLInputElement).value)
                }
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Detail rows - only in create mode */}
      {!isEditing && (
        <>
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-marron">Detalle de la Venta</Label>
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
                              {pt.nombre} — {formatCurrency(pt.precio_venta)}
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
                      {detalle.descuentoVolumenId && detalle.precioUnitarioOriginal && (
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                          <span className="text-muted-foreground line-through">
                            {formatCurrency(parseFloat(detalle.precioUnitarioOriginal))}
                          </span>
                          <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                            −{detalle.descuentoVolumenTipo === 'porcentaje'
                              ? `${detalle.descuentoVolumenValor}%`
                              : formatCurrency(parseFloat(detalle.descuentoUnitario || '0'))}
                          </span>
                          {detalle.descuentoNombre && (
                            <span className="text-muted-foreground">{detalle.descuentoNombre}</span>
                          )}
                        </div>
                      )}
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
      {isEditing && venta.detalle && venta.detalle.length > 0 && (
        <>
          <Separator />
          <div>
            <Label className="text-sm font-semibold text-marron mb-2 block">
              Detalle de la Venta (solo lectura)
            </Label>
            <div className="rounded-lg border border-marron/10 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-medium">Producto</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Cantidad</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">P. Unit.</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">Descuento</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.detalle.map((d: any) => (
                    <tr key={d.id} className="border-t border-marron/5">
                      <td className="p-2 text-marron">
                        {d.productoTerminado?.nombre || '-'}
                      </td>
                      <td className="p-2 text-right">{d.cantidad}</td>
                      <td className="p-2 text-right">
                        {d.descuento_volumen_id && d.precio_unitario_original ? (
                          <div className="flex flex-col items-end">
                            <span className="text-muted-foreground line-through text-xs">
                              {formatCurrency(d.precio_unitario_original)}
                            </span>
                            <span>{formatCurrency(d.precio_unitario)}</span>
                          </div>
                        ) : (
                          formatCurrency(d.precio_unitario)
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {d.descuento_volumen_id ? (
                          <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                            −{d.descuento_volumen_tipo === 'porcentaje'
                              ? `${d.descuento_volumen_valor}%`
                              : formatCurrency(d.descuento_unitario || 0)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
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
                  <span>{formatCurrency(venta.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA</span>
                  <span>{formatCurrency(venta.iva)}</span>
                </div>
                <div className="flex justify-between font-bold text-marron">
                  <span>Total</span>
                  <span>{formatCurrency(venta.total)}</span>
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
            'Registrar Venta'
          )}
        </Button>
      </div>
    </div>
  )
}
