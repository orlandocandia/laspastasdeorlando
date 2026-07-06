'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Printer,
  Search,
  Loader2,
  User,
  Package,
  FileDown,
  MessageCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

interface Cliente {
  id: number
  nombre: string
  apellido: string
  razon_social?: string | null
  cuit?: string | null
  condicion_iva?: string | null
  tipo_persona: string
  contactos?: Array<{
    id: number
    valor: string
    es_principal: boolean
    tipo: { id: number; nombre: string }
  }>
}

interface Producto {
  id: number
  nombre: string
  codigo?: string | null
  precio_venta: number
  stock_actual: number
  categoria?: { nombre: string } | null
}

interface DetalleItem {
  id_producto_terminado: number
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  // Snapshot del descuento por volumen aplicado
  descuento_volumen_id?: number | null
  descuento_volumen_valor?: number | null
  descuento_volumen_tipo?: string | null  // "porcentaje" | "fijo"
  precio_unitario_original?: number | null
  descuento_unitario?: number | null
  descuento_nombre?: string | null
}

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)

  // Cliente
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)

  // Productos
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoSearch, setProductoSearch] = useState('')
  const [productoDialogOpen, setProductoDialogOpen] = useState(false)
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Detalles
  const [detalles, setDetalles] = useState<DetalleItem[]>([])

  // Descuento por volumen — guard anti-race-condition y debounce por fila
  const recalcSeqRef = useRef<Map<number, number>>(new Map())
  const recalcTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // Recalcular descuento por volumen para un producto del detalle
  const recalcularDescuento = useCallback(async (idProducto: number, cantidad: number) => {
    const seq = (recalcSeqRef.current.get(idProducto) ?? 0) + 1
    recalcSeqRef.current.set(idProducto, seq)

    // Sin cantidad válida → limpiar descuento y volver al precio original del producto
    if (!idProducto || !cantidad || cantidad <= 0) {
      setDetalles(prev => prev.map(d => {
        if (d.id_producto_terminado !== idProducto) return d
        if (recalcSeqRef.current.get(idProducto) !== seq) return d
        // Buscar precio original del producto en la lista cargada
        const prod = productos.find(p => p.id === idProducto)
        const precioOriginal = prod?.precio_venta ?? d.precio_unitario
        return {
          ...d,
          precio_unitario: precioOriginal,
          subtotal: d.cantidad * precioOriginal,
          descuento_volumen_id: null,
          descuento_volumen_valor: null,
          descuento_volumen_tipo: null,
          precio_unitario_original: null,
          descuento_unitario: null,
          descuento_nombre: null,
        }
      }))
      return
    }

    try {
      const res = await fetch(`/api/descuentos-volumen/calcular?producto_id=${encodeURIComponent(idProducto)}&cantidad=${encodeURIComponent(cantidad)}`)
      if (!res.ok) return
      const data = await res.json()

      if (recalcSeqRef.current.get(idProducto) !== seq) return

      setDetalles(prev => prev.map(d => {
        if (d.id_producto_terminado !== idProducto) return d
        // Si el usuario cambió la cantidad mientras esperábamos la API, no pisar
        if (d.cantidad !== cantidad) return d

        if (data.descuento && data.precio_final != null) {
          const precioFinal = data.precio_final
          return {
            ...d,
            precio_unitario: precioFinal,
            subtotal: d.cantidad * precioFinal,
            descuento_volumen_id: data.descuento.id ?? null,
            descuento_volumen_valor: data.descuento.valor ?? null,
            descuento_volumen_tipo: data.descuento.tipo_descuento ?? null,
            precio_unitario_original: data.precio_original ?? null,
            descuento_unitario: data.descuento_aplicado ?? null,
            descuento_nombre: data.descuento.nombre ?? null,
          }
        } else {
          // Sin descuento → volver al precio original del producto
          const precioOriginal = data.precio_original ?? d.precio_unitario
          return {
            ...d,
            precio_unitario: precioOriginal,
            subtotal: d.cantidad * precioOriginal,
            descuento_volumen_id: null,
            descuento_volumen_valor: null,
            descuento_volumen_tipo: null,
            precio_unitario_original: null,
            descuento_unitario: null,
            descuento_nombre: null,
          }
        }
      }))
    } catch {
      // Best-effort: si falla el cálculo, el formulario sigue funcionando sin descuento
    }
  }, [productos])

  // Programar recálculo con debounce (350ms)
  const programarRecalcDescuento = useCallback((idProducto: number, cantidad: number) => {
    const existing = recalcTimersRef.current.get(idProducto)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      recalcTimersRef.current.delete(idProducto)
      void recalcularDescuento(idProducto, cantidad)
    }, 350)
    recalcTimersRef.current.set(idProducto, timer)
  }, [recalcularDescuento])

  // Form
  const [fechaValidez, setFechaValidez] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [iva, setIva] = useState('0')

  // Set default fecha_validez 30 days from now
  useEffect(() => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 30)
    setFechaValidez(fecha.toISOString().split('T')[0])
  }, [])

  // Fetch clientes
  const fetchClientes = useCallback(async () => {
    setLoadingClientes(true)
    try {
      const params = new URLSearchParams()
      params.set('tipo', 'Cliente')
      if (clienteSearch) params.set('buscar', clienteSearch)
      const res = await fetch(`/api/personas?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      // La API retorna { personas: [...] } — aceptar ambos formatos por compatibilidad
      const lista = Array.isArray(data) ? data : (data.personas || data.data || [])
      setClientes(lista)
    } catch {
      toast.error('Error al buscar clientes')
    } finally {
      setLoadingClientes(false)
    }
  }, [clienteSearch])

  useEffect(() => {
    if (clienteDialogOpen) fetchClientes()
  }, [clienteDialogOpen, fetchClientes])

  // Fetch productos
  const fetchProductos = useCallback(async () => {
    setLoadingProductos(true)
    try {
      const params = new URLSearchParams()
      if (productoSearch) params.set('buscar', productoSearch)
      const res = await fetch(`/api/productos-terminados?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : data.data || [])
    } catch {
      toast.error('Error al buscar productos')
    } finally {
      setLoadingProductos(false)
    }
  }, [productoSearch])

  useEffect(() => {
    if (productoDialogOpen) fetchProductos()
  }, [productoDialogOpen, fetchProductos])

  // Agregar producto al detalle
  const agregarProducto = (producto: Producto) => {
    const existente = detalles.find(d => d.id_producto_terminado === producto.id)
    if (existente) {
      const nuevaCantidad = existente.cantidad + 1
      setDetalles(detalles.map(d =>
        d.id_producto_terminado === producto.id
          ? { ...d, cantidad: nuevaCantidad, subtotal: nuevaCantidad * d.precio_unitario }
          : d
      ))
      // Recalcular descuento con la nueva cantidad
      programarRecalcDescuento(producto.id, nuevaCantidad)
    } else {
      setDetalles([...detalles, {
        id_producto_terminado: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio_venta,
        subtotal: producto.precio_venta,
      }])
      // Recalcular descuento (cantidad = 1)
      programarRecalcDescuento(producto.id, 1)
    }
    setProductoDialogOpen(false)
  }

  // Actualizar cantidad
  const actualizarCantidad = (idProducto: number, cantidad: number) => {
    if (cantidad <= 0) return
    setDetalles(detalles.map(d =>
      d.id_producto_terminado === idProducto
        ? { ...d, cantidad, subtotal: cantidad * d.precio_unitario }
        : d
    ))
    // Recalcular descuento por volumen con la nueva cantidad
    programarRecalcDescuento(idProducto, cantidad)
  }

  // Actualizar precio
  const actualizarPrecio = (idProducto: number, precio: number) => {
    if (precio < 0) return
    setDetalles(detalles.map(d =>
      d.id_producto_terminado === idProducto
        ? {
            ...d,
            precio_unitario: precio,
            subtotal: d.cantidad * precio,
            // Edición manual de precio → el usuario overridea, limpiar descuento
            descuento_volumen_id: null,
            descuento_volumen_valor: null,
            descuento_volumen_tipo: null,
            precio_unitario_original: null,
            descuento_unitario: null,
            descuento_nombre: null,
          }
        : d
    ))
  }

  // Eliminar detalle
  const eliminarDetalle = (idProducto: number) => {
    setDetalles(detalles.filter(d => d.id_producto_terminado !== idProducto))
  }

  // Cálculos
  const subtotal = detalles.reduce((sum, d) => sum + d.subtotal, 0)
  const ivaAmount = parseFloat(iva) || 0
  const total = subtotal + ivaAmount

  // Guardar presupuesto
  // accion: 'guardar' | 'imprimir' | 'pdf' | 'whatsapp'
  const guardarPresupuesto = async (accion: 'guardar' | 'imprimir' | 'pdf' | 'whatsapp' = 'guardar') => {
    if (!clienteSeleccionado) {
      toast.error('Debe seleccionar un cliente')
      return
    }
    if (!fechaValidez) {
      toast.error('Debe ingresar la fecha de validez')
      return
    }
    if (detalles.length === 0) {
      toast.error('Debe agregar al menos un producto')
      return
    }

    setGuardando(true)
    try {
      const body = {
        id_cliente: clienteSeleccionado.id,
        fecha_validez: fechaValidez,
        observaciones: observaciones || null,
        iva: ivaAmount,
        detalles: detalles.map(d => ({
          id_producto_terminado: d.id_producto_terminado,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento_volumen_id: d.descuento_volumen_id ?? null,
          descuento_volumen_valor: d.descuento_volumen_valor ?? null,
          descuento_volumen_tipo: d.descuento_volumen_tipo ?? null,
          precio_unitario_original: d.precio_unitario_original ?? null,
          descuento_unitario: d.descuento_unitario ?? null,
          descuento_nombre: d.descuento_nombre ?? null,
        })),
      }

      const res = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al crear presupuesto')
      }

      const presupuesto = await res.json()
      toast.success('Presupuesto creado correctamente')

      if (accion === 'guardar') {
        router.push('/admin/presupuestos')
      } else {
        // Para imprimir, pdf o whatsapp, ir al detalle donde están los botones
        // Pasamos un query param para que el detalle sepa qué hacer automáticamente
        const query = accion !== 'imprimir' ? `?accion=${accion}` : ''
        router.push(`/admin/presupuestos/${presupuesto.id}${query}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear presupuesto')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/presupuestos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-marron">Nuevo Presupuesto</h1>
          <p className="text-sm text-muted-foreground">Complete los datos para crear un presupuesto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Datos principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                <User className="h-4 w-4" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clienteSeleccionado ? (
                <div className="flex items-center justify-between p-3 bg-crema rounded-lg">
                  <div>
                    <p className="font-semibold text-marron">
                      {clienteSeleccionado.razon_social || `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`}
                    </p>
                    {clienteSeleccionado.cuit && (
                      <p className="text-sm text-muted-foreground">CUIT: {clienteSeleccionado.cuit}</p>
                    )}
                    {clienteSeleccionado.condicion_iva && (
                      <p className="text-sm text-muted-foreground">IVA: {clienteSeleccionado.condicion_iva}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setClienteSeleccionado(null)}>
                    Cambiar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-marron/30 text-marron/60 hover:bg-mostaza/5"
                  onClick={() => setClienteDialogOpen(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar cliente...
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Productos */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                <Package className="h-4 w-4" /> Productos
              </CardTitle>
              <Button
                size="sm"
                className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
                onClick={() => setProductoDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {detalles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay productos agregados</p>
                  <Button
                    variant="link"
                    className="text-mostaza mt-1"
                    onClick={() => setProductoDialogOpen(true)}
                  >
                    Agregar productos
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center w-24">Cantidad</TableHead>
                      <TableHead className="text-right w-40">Precio Unit.</TableHead>
                      <TableHead className="text-right w-32">Subtotal</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalles.map((d) => (
                      <TableRow key={d.id_producto_terminado}>
                        <TableCell className="font-medium">{d.nombre}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={d.cantidad}
                            onChange={(e) => actualizarCantidad(d.id_producto_terminado, parseFloat(e.target.value) || 0)}
                            className="text-center h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-end gap-0.5">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={d.precio_unitario}
                              onChange={(e) => actualizarPrecio(d.id_producto_terminado, parseFloat(e.target.value) || 0)}
                              className="text-right h-8"
                            />
                            {d.descuento_volumen_id && d.precio_unitario_original ? (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-muted-foreground line-through">
                                  {formatCurrency(d.precio_unitario_original)}
                                </span>
                                <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                                  −{d.descuento_volumen_tipo === 'porcentaje'
                                    ? `${d.descuento_volumen_valor}%`
                                    : formatCurrency(d.descuento_unitario || 0)}
                                </span>
                              </div>
                            ) : null}
                            {d.descuento_nombre && (
                              <span className="text-xs text-muted-foreground">{d.descuento_nombre}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(d.subtotal)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rojo hover:text-rojo/80" onClick={() => eliminarDetalle(d.id_producto_terminado)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observaciones adicionales para el presupuesto..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Resumen */}
        <div className="space-y-6">
          {/* Validez */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron">Datos del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fecha_validez">Fecha de Validez</Label>
                <Input
                  id="fecha_validez"
                  type="date"
                  value={fechaValidez}
                  onChange={(e) => setFechaValidez(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="iva">IVA ($)</Label>
                <Input
                  id="iva"
                  type="number"
                  min="0"
                  step="0.01"
                  value={iva}
                  onChange={(e) => setIva(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Totales */}
          <Card className="border-mostaza/30 bg-crema/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA:</span>
                <span className="font-semibold">{formatCurrency(ivaAmount)}</span>
              </div>
              <div className="border-t border-marron/20 pt-2 flex justify-between">
                <span className="font-bold text-marron text-lg">TOTAL:</span>
                <span className="font-bold text-mostaza text-lg">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{detalles.length} producto{detalles.length !== 1 ? 's' : ''} en el presupuesto</p>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="space-y-2">
            <Button
              className="w-full bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
              disabled={guardando}
              onClick={() => guardarPresupuesto('guardar')}
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
            <Button
              variant="outline"
              className="w-full border-marron/30"
              disabled={guardando}
              onClick={() => guardarPresupuesto('imprimir')}
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
              Guardar e Imprimir
            </Button>
            <Button
              variant="outline"
              className="w-full border-marron/30 text-marron hover:bg-marron/5"
              disabled={guardando}
              onClick={() => guardarPresupuesto('pdf')}
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
              Guardar y Exportar PDF
            </Button>
            <Button
              variant="outline"
              className="w-full border-whatsapp/30 text-whatsapp hover:bg-whatsapp/10"
              disabled={guardando}
              onClick={() => guardarPresupuesto('whatsapp')}
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
              Guardar y Enviar WhatsApp
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/admin/presupuestos')}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog selección de cliente */}
      <Dialog open={clienteDialogOpen} onOpenChange={setClienteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-marron">Seleccionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o razón social..."
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {loadingClientes ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-mostaza" /></div>
              ) : clientes.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">No se encontraron clientes</p>
              ) : (
                clientes.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-crema transition-colors"
                    onClick={() => {
                      setClienteSeleccionado(c)
                      setClienteDialogOpen(false)
                      setClienteSearch('')
                    }}
                  >
                    <p className="font-medium text-marron">{c.razon_social || `${c.nombre} ${c.apellido}`}</p>
                    {c.cuit && <p className="text-sm text-muted-foreground">CUIT: {c.cuit}</p>}
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog selección de producto */}
      <Dialog open={productoDialogOpen} onOpenChange={setProductoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-marron">Agregar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={productoSearch}
                onChange={(e) => setProductoSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {loadingProductos ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-mostaza" /></div>
              ) : productos.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">No se encontraron productos</p>
              ) : (
                productos.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-crema transition-colors"
                    onClick={() => agregarProducto(p)}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium text-marron">{p.nombre}</p>
                      <span className="font-semibold text-mostaza">{formatCurrency(p.precio_venta)}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {p.codigo && <Badge variant="outline" className="text-xs">{p.codigo}</Badge>}
                      <Badge variant="outline" className="text-xs">Stock: {p.stock_actual}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
