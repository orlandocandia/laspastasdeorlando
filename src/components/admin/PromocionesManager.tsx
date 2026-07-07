'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Search, Loader2, Tag, Percent, DollarSign, Clock, Gift } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface ProductoTerminadoSimple {
  id: number
  nombre: string
  precio_venta: number
  codigo: string | null
  codigo_barras: string | null
}

interface PromocionProductoItem {
  id: number
  id_producto_terminado: number
  id_categoria: number | null
  productoTerminado: { id: number; nombre: string; precio_venta: number } | null
  categoria: { id: number; nombre: string } | null
}

interface Promocion {
  id: number
  nombre: string
  descripcion: string | null
  tipo: string
  valor_descuento: number
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  aplicar_auto: boolean
  createdAt: string
  productos: PromocionProductoItem[]
}

const TIPO_OPTIONS = [
  { value: 'porcentual', label: 'Porcentual', icon: Percent },
  { value: 'fijo', label: 'Monto Fijo', icon: DollarSign },
  { value: '2x1', label: '2x1', icon: Gift },
  { value: 'tiempo_limitado', label: 'Tiempo Limitado', icon: Clock },
] as const

function getTipoBadge(tipo: string) {
  switch (tipo) {
    case 'porcentual':
      return <Badge className="bg-mostaza/10 text-mostaza hover:bg-mostaza/20 border-0">Porcentual</Badge>
    case 'fijo':
      return <Badge className="bg-oliva/10 text-oliva hover:bg-oliva/20 border-0">Monto Fijo</Badge>
    case '2x1':
      return <Badge className="bg-marron/10 text-marron hover:bg-marron/20 border-0">2x1</Badge>
    case 'tiempo_limitado':
      return <Badge className="bg-rojo/10 text-rojo hover:bg-rojo/20 border-0">Tiempo Limitado</Badge>
    default:
      return <Badge variant="secondary">{tipo}</Badge>
  }
}

function formatDiscount(promo: Promocion) {
  if (promo.tipo === 'porcentual') return `${promo.valor_descuento}%`
  if (promo.tipo === 'fijo') return `$${promo.valor_descuento.toLocaleString('es-AR')}`
  if (promo.tipo === '2x1') return '2x1'
  if (promo.tipo === 'tiempo_limitado') return `${promo.valor_descuento}%`
  return `${promo.valor_descuento}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PromocionesManager() {
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('all')

  // Productos disponibles para seleccionar
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoTerminadoSimple[]>([])
  const [busquedaProducto, setBusquedaProducto] = useState('')

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formTipo, setFormTipo] = useState('porcentual')
  const [formValorDescuento, setFormValorDescuento] = useState('')
  const [formFechaInicio, setFormFechaInicio] = useState('')
  const [formFechaFin, setFormFechaFin] = useState('')
  const [formAplicarAuto, setFormAplicarAuto] = useState(false)
  const [formProductosSeleccionados, setFormProductosSeleccionados] = useState<number[]>([])

  // Delete
  const [deleteItem, setDeleteItem] = useState<Promocion | null>(null)

  const fetchPromociones = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo && filtroTipo !== 'all') params.set('tipo', filtroTipo)
      if (filtroEstado && filtroEstado !== 'all') params.set('activo', filtroEstado)

      const res = await fetch(`/api/promociones?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar promociones')
      const data = await res.json()
      setPromociones(data.data || [])
    } catch {
      toast.error('Error al cargar promociones')
    } finally {
      setLoading(false)
    }
  }, [filtroTipo, filtroEstado])

  const fetchProductos = useCallback(async () => {
    try {
      // CORRECCIÓN: traer TODOS los productos (sin filtro de estado ni visibilidad)
      // y con limite alto para que el buscador de promociones los muestre todos.
      // Antes se filtraba con ?estado=true lo que ocultaba productos inactivos.
      const res = await fetch('/api/productos-terminados?limite=500')
      if (!res.ok) return
      const data = await res.json()
      const items = data.data || data
      setProductosDisponibles(
        Array.isArray(items)
          ? items.map((p: ProductoTerminadoSimple) => ({
              id: p.id,
              nombre: p.nombre,
              precio_venta: p.precio_venta,
              codigo: (p as { codigo?: string | null }).codigo ?? null,
              codigo_barras: (p as { codigo_barras?: string | null }).codigo_barras ?? null,
            }))
          : []
      )
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchPromociones()
  }, [fetchPromociones])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  const resetForm = () => {
    setFormNombre('')
    setFormDescripcion('')
    setFormTipo('porcentual')
    setFormValorDescuento('')
    setFormFechaInicio('')
    setFormFechaFin('')
    setFormAplicarAuto(false)
    setFormProductosSeleccionados([])
    setEditingId(null)
    setBusquedaProducto('')
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (promo: Promocion) => {
    setEditingId(promo.id)
    setFormNombre(promo.nombre)
    setFormDescripcion(promo.descripcion || '')
    setFormTipo(promo.tipo)
    setFormValorDescuento(String(promo.valor_descuento))
    setFormFechaInicio(promo.fecha_inicio ? new Date(promo.fecha_inicio).toISOString().split('T')[0] : '')
    setFormFechaFin(promo.fecha_fin ? new Date(promo.fecha_fin).toISOString().split('T')[0] : '')
    setFormAplicarAuto(promo.aplicar_auto)
    setFormProductosSeleccionados(promo.productos?.map(p => p.id_producto_terminado).filter(Boolean) || [])
    setBusquedaProducto('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formNombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (!formTipo) {
      toast.error('Seleccione un tipo de promoción')
      return
    }
    if (formTipo !== '2x1' && (!formValorDescuento || parseFloat(formValorDescuento) <= 0)) {
      toast.error('Ingrese un valor de descuento válido')
      return
    }
    if (!formFechaInicio) {
      toast.error('La fecha de inicio es requerida')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || null,
        tipo: formTipo,
        valor_descuento: formTipo === '2x1' ? 0 : parseFloat(formValorDescuento),
        fecha_inicio: formFechaInicio,
        fecha_fin: formFechaFin || null,
        aplicar_auto: formAplicarAuto,
        productos: formProductosSeleccionados.map(id => ({ id_producto_terminado: id })),
      }

      const url = editingId ? `/api/promociones/${editingId}` : '/api/promociones'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar promoción')
      }

      toast.success(editingId ? 'Promoción actualizada' : 'Promoción creada')
      setDialogOpen(false)
      resetForm()
      fetchPromociones()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar promoción'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/promociones/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al desactivar promoción')
      }
      toast.success('Promoción desactivada')
      fetchPromociones()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al desactivar promoción'
      toast.error(msg)
    } finally {
      setDeleteItem(null)
    }
  }

  const toggleProductoSeleccionado = (id: number) => {
    setFormProductosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const productosFiltrados = productosDisponibles.filter(p => {
    const q = busquedaProducto.toLowerCase().trim()
    if (!q) return true
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo ?? '').toLowerCase().includes(q) ||
      (p.codigo_barras ?? '').toLowerCase().includes(q)
    )
  })

  const filteredPromociones = promociones

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {TIPO_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Promoción
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-mostaza" />
        </div>
      ) : filteredPromociones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay promociones cargadas
        </div>
      ) : (
        <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Descuento</TableHead>
                <TableHead className="hidden sm:table-cell">Inicio</TableHead>
                <TableHead className="hidden lg:table-cell">Fin</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromociones.map((promo) => (
                <TableRow key={promo.id} className="hover:bg-mostaza/5">
                  <TableCell>
                    <div>
                      <span className="font-medium text-marron">{promo.nombre}</span>
                      {promo.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{promo.descripcion}</p>
                      )}
                      {promo.productos && promo.productos.length > 0 && (
                        <p className="text-xs text-oliva mt-0.5">
                          {promo.productos.length} producto{promo.productos.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTipoBadge(promo.tipo)}</TableCell>
                  <TableCell className="hidden md:table-cell font-medium">
                    {formatDiscount(promo)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {formatDate(promo.fecha_inicio)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {formatDate(promo.fecha_fin)}
                  </TableCell>
                  <TableCell className="text-center">
                    {promo.activo ? (
                      <Badge className="bg-oliva/10 text-oliva hover:bg-oliva/20 border-0">Activo</Badge>
                    ) : (
                      <Badge className="bg-rojo/10 text-rojo hover:bg-rojo/20 border-0">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-mostaza/10"
                        onClick={() => openEditDialog(promo)}
                      >
                        <Pencil className="h-4 w-4 text-mostaza" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-rojo/10"
                        onClick={() => setDeleteItem(promo)}
                        disabled={!promo.activo}
                      >
                        <Trash2 className="h-4 w-4 text-rojo" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <Label className="text-sm font-medium text-marron mb-1 block">Nombre *</Label>
              <Input
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Promo Verano, Descuento Navidad..."
              />
            </div>

            {/* Descripción */}
            <div>
              <Label className="text-sm font-medium text-marron mb-1 block">Descripción</Label>
              <Textarea
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Descripción de la promoción (opcional)..."
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Tipo y Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Tipo *</Label>
                <Select value={formTipo} onValueChange={(val) => {
                  setFormTipo(val)
                  if (val === '2x1') setFormValorDescuento('0')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formTipo !== '2x1' && (
                <div>
                  <Label className="text-sm font-medium text-marron mb-1 block">
                    Valor de descuento {formTipo === 'porcentual' || formTipo === 'tiempo_limitado' ? '(%)' : '($)'} *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step={formTipo === 'porcentual' || formTipo === 'tiempo_limitado' ? '1' : '0.01'}
                    value={formValorDescuento}
                    onChange={(e) => setFormValorDescuento(e.target.value)}
                    placeholder={formTipo === 'porcentual' || formTipo === 'tiempo_limitado' ? 'Ej: 15' : 'Ej: 500'}
                  />
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Fecha inicio *</Label>
                <Input
                  type="date"
                  value={formFechaInicio}
                  onChange={(e) => setFormFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Fecha fin</Label>
                <Input
                  type="date"
                  value={formFechaFin}
                  onChange={(e) => setFormFechaFin(e.target.value)}
                />
              </div>
            </div>

            {/* Aplicar automáticamente */}
            <div className="flex items-center gap-3 py-2">
              <Switch
                id="aplicar-auto"
                checked={formAplicarAuto}
                onCheckedChange={setFormAplicarAuto}
              />
              <Label htmlFor="aplicar-auto" className="text-sm font-normal cursor-pointer">
                Aplicar automáticamente en ventas
              </Label>
            </div>

            {/* Productos participantes */}
            <div>
              <Label className="text-sm font-medium text-marron mb-2 block">
                Productos participantes
              </Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {formProductosSeleccionados.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formProductosSeleccionados.map(id => {
                      const prod = productosDisponibles.find(p => p.id === id)
                      if (!prod) return null
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="bg-mostaza/10 text-marron hover:bg-mostaza/20 cursor-pointer"
                          onClick={() => toggleProductoSeleccionado(id)}
                        >
                          {prod.nombre}
                          <span className="ml-1 text-xs">×</span>
                        </Badge>
                      )
                    })}
                  </div>
                )}
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {productosFiltrados.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No se encontraron productos
                    </div>
                  ) : (
                    productosFiltrados.map(producto => {
                      const isSelected = formProductosSeleccionados.includes(producto.id)
                      return (
                        <button
                          key={producto.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-mostaza/5 transition-colors ${
                            isSelected ? 'bg-mostaza/10' : ''
                          }`}
                          onClick={() => toggleProductoSeleccionado(producto.id)}
                        >
                          <span className={isSelected ? 'font-medium text-marron' : 'text-foreground'}>
                            {producto.nombre}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ${producto.precio_venta.toLocaleString('es-AR')}
                            {isSelected && <span className="ml-1.5 text-oliva">✓</span>}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Guardar Cambios' : 'Crear Promoción'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              La promoción &quot;{deleteItem?.nombre}&quot; será marcada como inactiva. Podrá reactivarla luego editando la promoción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rojo hover:bg-rojo/90 text-white"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
