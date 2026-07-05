'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Loader2, Layers, Infinity, MinusCircle,
} from 'lucide-react'

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

// ── Interfaces ──────────────────────────────────────────────────────

interface RangoDescuento {
  id?: number
  cantidad_desde: number
  cantidad_hasta: number | null
  tipo_descuento: string
  valor: number
  descripcion: string | null
}

interface DescuentoVolumen {
  id: number
  nombre: string
  descripcion: string | null
  tipo_item: string
  item_id: number | null
  unidad_medida: string
  activo: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  rangos: RangoDescuento[]
  createdAt: string
  updatedAt: string
}

interface ItemSimple {
  id: number
  nombre: string
}

// ── Constants ───────────────────────────────────────────────────────

const TIPO_ITEM_OPTIONS = [
  { value: 'todos', label: 'Todos los productos' },
  { value: 'producto', label: 'Producto específico' },
  { value: 'categoria', label: 'Categoría' },
] as const

const UNIDAD_MEDIDA_OPTIONS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'u', label: 'Unidades (u)' },
  { value: 'bandeja', label: 'Bandejas' },
  { value: 'docena', label: 'Docenas' },
  { value: 'l', label: 'Litros (l)' },
] as const

const TIPO_DESCUENTO_OPTIONS = [
  { value: 'porcentaje', label: 'Porcentaje' },
  { value: 'fijo', label: 'Monto fijo' },
] as const

const emptyRango = (): RangoDescuento => ({
  cantidad_desde: 0,
  cantidad_hasta: null,
  tipo_descuento: 'porcentaje',
  valor: 0,
  descripcion: null,
})

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getTipoItemLabel(tipo: string) {
  switch (tipo) {
    case 'todos': return 'Todos'
    case 'producto': return 'Producto'
    case 'categoria': return 'Categoría'
    default: return tipo
  }
}

function getUnidadLabel(unidad: string) {
  const found = UNIDAD_MEDIDA_OPTIONS.find(o => o.value === unidad)
  return found ? found.value : unidad
}

function rangosSummary(rangos: RangoDescuento[]) {
  if (!rangos || rangos.length === 0) return '-'
  const first = rangos[0]
  const last = rangos[rangos.length - 1]
  const desdeStr = first.cantidad_desde
  const hastaStr = last.cantidad_hasta == null ? '∞' : last.cantidad_hasta
  return `${rangos.length} rango${rangos.length > 1 ? 's' : ''} (${desdeStr}–${hastaStr})`
}

function formatRangoDiscount(rango: RangoDescuento) {
  if (rango.tipo_descuento === 'porcentaje') return `${rango.valor}%`
  return `$${rango.valor.toLocaleString('es-AR')}`
}

// ── Component ───────────────────────────────────────────────────────

export default function DescuentosVolumenManager() {
  // List state
  const [descuentos, setDescuentos] = useState<DescuentoVolumen[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('all')

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Items for dropdowns
  const [productos, setProductos] = useState<ItemSimple[]>([])
  const [categorias, setCategorias] = useState<ItemSimple[]>([])

  // Form fields
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formTipoItem, setFormTipoItem] = useState('todos')
  const [formItemId, setFormItemId] = useState('')
  const [formUnidadMedida, setFormUnidadMedida] = useState('kg')
  const [formFechaInicio, setFormFechaInicio] = useState('')
  const [formFechaFin, setFormFechaFin] = useState('')
  const [formActivo, setFormActivo] = useState(true)
  const [formRangos, setFormRangos] = useState<RangoDescuento[]>([emptyRango()])

  // Delete
  const [deleteItem, setDeleteItem] = useState<DescuentoVolumen | null>(null)

  // ── Fetch ───────────────────────────────────────────────────────

  const fetchDescuentos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado && filtroEstado !== 'all') params.set('activo', filtroEstado)

      const res = await fetch(`/api/descuentos-volumen?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar descuentos')
      const data = await res.json()
      setDescuentos(data.data || [])
    } catch {
      toast.error('Error al cargar descuentos por volumen')
    } finally {
      setLoading(false)
    }
  }, [filtroEstado])

  const fetchProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/productos-terminados?estado=true&limite=500')
      if (!res.ok) return
      const data = await res.json()
      const items = data.data || data
      setProductos(Array.isArray(items) ? items.map((p: ItemSimple) => ({ id: p.id, nombre: p.nombre })) : [])
    } catch {
      // silently fail
    }
  }, [])

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias?tipo=productos-terminados')
      if (!res.ok) return
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data.map((c: ItemSimple) => ({ id: c.id, nombre: c.nombre })) : [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchDescuentos()
  }, [fetchDescuentos])

  useEffect(() => {
    fetchProductos()
    fetchCategorias()
  }, [fetchProductos, fetchCategorias])

  // ── Form helpers ────────────────────────────────────────────────

  const resetForm = () => {
    setFormNombre('')
    setFormDescripcion('')
    setFormTipoItem('todos')
    setFormItemId('')
    setFormUnidadMedida('kg')
    setFormFechaInicio('')
    setFormFechaFin('')
    setFormActivo(true)
    setFormRangos([emptyRango()])
    setEditingId(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = async (desc: DescuentoVolumen) => {
    setEditingId(desc.id)
    setFormNombre(desc.nombre)
    setFormDescripcion(desc.descripcion || '')
    setFormTipoItem(desc.tipo_item)
    setFormItemId(desc.item_id != null ? String(desc.item_id) : '')
    setFormUnidadMedida(desc.unidad_medida)
    setFormFechaInicio(desc.fecha_inicio ? new Date(desc.fecha_inicio).toISOString().split('T')[0] : '')
    setFormFechaFin(desc.fecha_fin ? new Date(desc.fecha_fin).toISOString().split('T')[0] : '')
    setFormActivo(desc.activo)
    setFormRangos(
      desc.rangos && desc.rangos.length > 0
        ? desc.rangos.map(r => ({
            id: r.id,
            cantidad_desde: r.cantidad_desde,
            cantidad_hasta: r.cantidad_hasta,
            tipo_descuento: r.tipo_descuento,
            valor: r.valor,
            descripcion: r.descripcion,
          }))
        : [emptyRango()]
    )
    setDialogOpen(true)
  }

  // ── Rangos handlers ──────────────────────────────────────────────

  const addRango = () => {
    const lastRango = formRangos[formRangos.length - 1]
    const newDesde = lastRango?.cantidad_hasta != null ? lastRango.cantidad_hasta : (lastRango?.cantidad_desde ?? 0) + 1
    setFormRangos(prev => [
      ...prev,
      {
        cantidad_desde: newDesde,
        cantidad_hasta: null,
        tipo_descuento: 'porcentaje',
        valor: 0,
        descripcion: null,
      },
    ])
  }

  const removeRango = (index: number) => {
    setFormRangos(prev => prev.filter((_, i) => i !== index))
  }

  const updateRango = (index: number, field: keyof RangoDescuento, value: string | number | null) => {
    setFormRangos(prev =>
      prev.map((r, i) => {
        if (i !== index) return r
        return { ...r, [field]: value }
      })
    )
  }

  const sortRangos = () => {
    setFormRangos(prev => [...prev].sort((a, b) => a.cantidad_desde - b.cantidad_desde))
  }

  // ── Save ────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formNombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (!formTipoItem) {
      toast.error('Seleccione a qué aplica el descuento')
      return
    }
    if (!formUnidadMedida) {
      toast.error('Seleccione una unidad de medida')
      return
    }
    if ((formTipoItem === 'producto' || formTipoItem === 'categoria') && !formItemId) {
      toast.error('Seleccione el producto o categoría')
      return
    }
    if (formRangos.length === 0) {
      toast.error('Debe incluir al menos un rango de descuento')
      return
    }
    // Validate rangos
    for (let i = 0; i < formRangos.length; i++) {
      const r = formRangos[i]
      if (r.cantidad_desde < 0) {
        toast.error(`Rango ${i + 1}: la cantidad desde no puede ser negativa`)
        return
      }
      if (r.cantidad_hasta != null && r.cantidad_hasta <= r.cantidad_desde) {
        toast.error(`Rango ${i + 1}: la cantidad hasta debe ser mayor que desde`)
        return
      }
      if (r.valor <= 0) {
        toast.error(`Rango ${i + 1}: el valor del descuento debe ser mayor que 0`)
        return
      }
    }

    setSaving(true)
    try {
      const sortedRangos = [...formRangos].sort((a, b) => a.cantidad_desde - b.cantidad_desde)

      const payload = {
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || null,
        tipo_item: formTipoItem,
        item_id: formTipoItem !== 'todos' && formItemId ? parseInt(formItemId) : null,
        unidad_medida: formUnidadMedida,
        activo: formActivo,
        fecha_inicio: formFechaInicio || null,
        fecha_fin: formFechaFin || null,
        rangos: sortedRangos.map(r => ({
          cantidad_desde: r.cantidad_desde,
          cantidad_hasta: r.cantidad_hasta,
          tipo_descuento: r.tipo_descuento,
          valor: r.valor,
          descripcion: r.descripcion || null,
        })),
      }

      const url = editingId ? `/api/descuentos-volumen/${editingId}` : '/api/descuentos-volumen'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar descuento')
      }

      toast.success(editingId ? 'Descuento actualizado' : 'Descuento creado')
      setDialogOpen(false)
      resetForm()
      fetchDescuentos()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar descuento'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/descuentos-volumen/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al desactivar descuento')
      }
      toast.success('Descuento desactivado')
      fetchDescuentos()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al desactivar descuento'
      toast.error(msg)
    } finally {
      setDeleteItem(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          Nuevo Descuento
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-mostaza" />
        </div>
      ) : descuentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay descuentos por volumen cargados
        </div>
      ) : (
        <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Aplica a</TableHead>
                <TableHead className="hidden md:table-cell">Unidad</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Inicio</TableHead>
                <TableHead className="hidden lg:table-cell">Fin</TableHead>
                <TableHead className="hidden xl:table-cell">Rangos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {descuentos.map((desc) => (
                <TableRow key={desc.id} className="hover:bg-mostaza/5">
                  <TableCell>
                    <div>
                      <span className="font-medium text-marron">{desc.nombre}</span>
                      {desc.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{desc.descripcion}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      className={`border-0 ${
                        desc.tipo_item === 'todos'
                          ? 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                          : desc.tipo_item === 'producto'
                            ? 'bg-mostaza/10 text-mostaza hover:bg-mostaza/20'
                            : 'bg-marron/10 text-marron hover:bg-marron/20'
                      }`}
                    >
                      {getTipoItemLabel(desc.tipo_item)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {getUnidadLabel(desc.unidad_medida)}
                  </TableCell>
                  <TableCell className="text-center">
                    {desc.activo ? (
                      <Badge className="bg-oliva/10 text-oliva hover:bg-oliva/20 border-0">Activo</Badge>
                    ) : (
                      <Badge className="bg-rojo/10 text-rojo hover:bg-rojo/20 border-0">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {formatDate(desc.fecha_inicio)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {formatDate(desc.fecha_fin)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                    {rangosSummary(desc.rangos)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-mostaza/10"
                        onClick={() => openEditDialog(desc)}
                      >
                        <Pencil className="h-4 w-4 text-mostaza" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-rojo/10"
                        onClick={() => setDeleteItem(desc)}
                        disabled={!desc.activo}
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

      {/* ── Create/Edit Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {editingId ? 'Editar Descuento por Volumen' : 'Nuevo Descuento por Volumen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <Label className="text-sm font-medium text-marron mb-1 block">Nombre *</Label>
              <Input
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Descuento mayorista, Precio por volumen..."
              />
            </div>

            {/* Descripción */}
            <div>
              <Label className="text-sm font-medium text-marron mb-1 block">Descripción</Label>
              <Textarea
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Descripción del descuento (opcional)..."
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Tipo Item + Unidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Aplica a *</Label>
                <Select value={formTipoItem} onValueChange={(val) => {
                  setFormTipoItem(val)
                  setFormItemId('')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_ITEM_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Unidad de medida *</Label>
                <Select value={formUnidadMedida} onValueChange={setFormUnidadMedida}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDAD_MEDIDA_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Item selector (conditional) */}
            {formTipoItem === 'producto' && (
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Producto *</Label>
                <Select value={formItemId} onValueChange={setFormItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {productos.length === 0 ? (
                      <SelectItem value="__none" disabled>No hay productos disponibles</SelectItem>
                    ) : (
                      productos.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formTipoItem === 'categoria' && (
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Categoría *</Label>
                <Select value={formItemId} onValueChange={setFormItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {categorias.length === 0 ? (
                      <SelectItem value="__none" disabled>No hay categorías disponibles</SelectItem>
                    ) : (
                      categorias.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rangos de descuento */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-marron">
                  Rangos de descuento *
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sortRangos}
                    className="text-xs h-7"
                  >
                    Ordenar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addRango}
                    className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold h-7"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Agregar rango
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {/* Rangos header */}
                <div className="bg-muted/50 grid grid-cols-[1fr_1fr_120px_100px_1fr_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>Desde</span>
                  <span>Hasta</span>
                  <span>Tipo</span>
                  <span>Valor</span>
                  <span>Descripción</span>
                  <span></span>
                </div>

                {/* Rangos rows */}
                <div className="divide-y">
                  {formRangos.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No hay rangos. Agregue al menos uno.
                    </div>
                  ) : (
                    formRangos.map((rango, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[1fr_1fr_120px_100px_1fr_40px] gap-2 px-3 py-2 items-center"
                      >
                        {/* cantidad_desde */}
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={rango.cantidad_desde}
                          onChange={(e) => updateRango(idx, 'cantidad_desde', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />

                        {/* cantidad_hasta */}
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={rango.cantidad_hasta ?? ''}
                            placeholder="∞"
                            onChange={(e) => {
                              const val = e.target.value
                              updateRango(idx, 'cantidad_hasta', val === '' ? null : parseFloat(val) || null)
                            }}
                            className="h-8 text-sm pr-6"
                          />
                          {rango.cantidad_hasta == null && (
                            <Infinity className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>

                        {/* tipo_descuento */}
                        <Select
                          value={rango.tipo_descuento}
                          onValueChange={(val) => updateRango(idx, 'tipo_descuento', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_DESCUENTO_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* valor */}
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step={rango.tipo_descuento === 'porcentaje' ? '1' : '0.01'}
                            value={rango.valor}
                            onChange={(e) => updateRango(idx, 'valor', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm pr-6"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {rango.tipo_descuento === 'porcentaje' ? '%' : '$'}
                          </span>
                        </div>

                        {/* descripcion */}
                        <Input
                          type="text"
                          value={rango.descripcion ?? ''}
                          placeholder="Opcional"
                          onChange={(e) => updateRango(idx, 'descripcion', e.target.value || null)}
                          className="h-8 text-sm"
                        />

                        {/* Remove */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-rojo/10"
                          onClick={() => removeRango(idx)}
                          disabled={formRangos.length <= 1}
                        >
                          <MinusCircle className="h-4 w-4 text-rojo" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rangos summary */}
              {formRangos.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground bg-crema/30 rounded-md p-2">
                  <span className="font-medium text-marron">Vista previa: </span>
                  {[...formRangos]
                    .sort((a, b) => a.cantidad_desde - b.cantidad_desde)
                    .map((r, i) => (
                      <span key={i}>
                        {i > 0 && ' → '}
                        <span className="text-marron">
                          {r.cantidad_desde}–{r.cantidad_hasta == null ? '∞' : r.cantidad_hasta} {formUnidadMedida}
                        </span>
                        {' '}
                        <span className="text-mostaza font-medium">{formatRangoDiscount(r)}</span>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-marron mb-1 block">Fecha inicio</Label>
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

            {/* Activo */}
            <div className="flex items-center gap-3 py-2">
              <Switch
                id="descuento-activo"
                checked={formActivo}
                onCheckedChange={setFormActivo}
              />
              <Label htmlFor="descuento-activo" className="text-sm font-normal cursor-pointer">
                Descuento activo
              </Label>
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
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Guardar Cambios' : 'Crear Descuento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────── */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar descuento?</AlertDialogTitle>
            <AlertDialogDescription>
              El descuento &quot;{deleteItem?.nombre}&quot; será marcado como inactivo. Podrá reactivarlo luego editando el descuento.
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
