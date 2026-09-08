'use client'

/**
 * ============================================================
 * Producciones — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/producciones
 * Gestión de producciones con workflow de estados:
 *   pending → confirmed | rejected
 * - Cálculo automático de costos (costPerServing × quantity).
 * - Solo las producciones "pending" pueden editarse/eliminarse.
 * - "confirmed" solo admite "Ver Detalle".
 * - "rejected" admite "Ver Detalle" + "Eliminar".
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2,
  Factory, Eye, Check, X, Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ============================================================
// Tipos
// ============================================================

type CmProductionStatus = 'pending' | 'confirmed' | 'rejected'

interface CmProductionRecord {
  id: string
  recipeId: string
  recipeTitle: string
  recipeCostPerServing: number
  placeId: string
  placeName: string
  cookId: string | null
  cookName: string | null
  quantity: number
  cost: number
  status: CmProductionStatus
  observations: string | null
  rejectionReason: string | null
  createdAt: number
  updatedAt: number
}

interface RecipeOption {
  id: string
  title: string
  costPerServing: number
}

interface PlaceOption {
  id: string
  name: string
}

type FormMode = 'create' | 'edit'
type StatusFilter = 'all' | CmProductionStatus

// ============================================================
// Constantes
// ============================================================

const STATUS_META: Record<CmProductionStatus, { label: string; bg: string }> = {
  pending: { label: 'Pendiente', bg: 'bg-[#E1AD01] hover:bg-[#E1AD01]' },
  confirmed: { label: 'Confirmada', bg: 'bg-[#708238] hover:bg-[#708238]' },
  rejected: { label: 'Rechazada', bg: 'bg-[#B91C1C] hover:bg-[#B91C1C]' },
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'rejected', label: 'Rechazadas' },
]

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (value: number): string =>
  `$${Number(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

const fmtDate = (ts: number): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// ============================================================
// Página
// ============================================================

function CmProduccionesPageContent() {
  const searchParams = useSearchParams()
  const [productions, setProductions] = React.useState<CmProductionRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [placeFilter, setPlaceFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmProductionRecord | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmProductionRecord | null>(null)
  const [detailItem, setDetailItem] = React.useState<CmProductionRecord | null>(null)
  const [rejectItem, setRejectItem] = React.useState<CmProductionRecord | null>(null)

  const [recipes, setRecipes] = React.useState<RecipeOption[]>([])
  const [places, setPlaces] = React.useState<PlaceOption[]>([])

  // Carga de dropdowns (recetas y lugares activos) — una sola vez al montar
  React.useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          fetch('/api/cocina-movil/recipes?isActive=true&pageSize=200'),
          fetch('/api/cocina-movil/places?isActive=true&pageSize=200'),
        ])
        const [rData, pData] = await Promise.all([
          rRes.json().catch(() => ({})),
          pRes.json().catch(() => ({})),
        ])
        setRecipes((rData.recipes || []).map((r: { id: string; title: string; costPerServing: number }) => ({
          id: r.id, title: r.title, costPerServing: r.costPerServing,
        })))
        setPlaces((pData.places || []).map((p: { id: string; name: string }) => ({
          id: p.id, name: p.name,
        })))
      } catch (err) {
        console.error('Error cargando dropdowns:', err)
      }
    }
    loadDropdowns()
  }, [])

  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormMode('create')
      setEditItem(null)
      setFormOpen(true)
    }
  }, [searchParams])

  const loadProductions = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (placeFilter !== 'all') params.set('placeId', placeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('pageSize', '200')
      params.set('sortBy', 'createdAt')
      params.set('sortOrder', 'desc')
      const res = await fetch(`/api/cocina-movil/productions?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setProductions(data.productions || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar producciones')
    } finally {
      setLoading(false)
    }
  }, [search, placeFilter, statusFilter])

  React.useEffect(() => {
    const id = setTimeout(loadProductions, 250)
    return () => clearTimeout(id)
  }, [loadProductions])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }

  const openEdit = (item: CmProductionRecord) => {
    if (item.status !== 'pending') {
      toast.error('Solo las producciones pendientes pueden editarse.')
      return
    }
    setFormMode('edit')
    setEditItem(item)
    setFormOpen(true)
  }

  const openDelete = (item: CmProductionRecord) => {
    if (item.status === 'confirmed') {
      toast.error('Las producciones confirmadas no pueden eliminarse.')
      return
    }
    setDeleteItem(item)
  }

  const handleConfirm = async (item: CmProductionRecord) => {
    try {
      const res = await fetch(`/api/cocina-movil/productions/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      toast.success('Producción confirmada')
      loadProductions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/productions/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      toast.success('Producción eliminada')
      setDeleteItem(null)
      loadProductions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (placeFilter !== 'all') params.set('placeId', placeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    window.open(`/api/cocina-movil/productions/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <Factory className="h-6 w-6" />Producciones
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nueva Producción
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por receta, cocinero o lugar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            <Select value={placeFilter} onValueChange={setPlaceFilter}>
              <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Lugar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los lugares</SelectItem>
                {places.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#5C3A21]/8">
            <span className="text-xs text-[#8A7E70] self-center mr-1">Exportar:</span>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="border-[#5C3A21]/20 text-[#5C3A21]"><Printer className="h-3.5 w-3.5" />Imprimir</Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('pdf')} className="border-[#5C3A21]/20 text-[#5C3A21]"><FileText className="h-3.5 w-3.5" />PDF</Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('word')} className="border-[#5C3A21]/20 text-[#5C3A21]"><FileDown className="h-3.5 w-3.5" />Word</Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('excel')} className="border-[#5C3A21]/20 text-[#5C3A21]"><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
              <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
            </div>
          ) : productions.length === 0 ? (
            <div className="py-16 text-center">
              <Factory className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron producciones.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Receta</TableHead>
                    <TableHead className="hidden md:table-cell">Cocinero</TableHead>
                    <TableHead className="hidden lg:table-cell">Lugar</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.map((p, i) => {
                    const meta = STATUS_META[p.status]
                    return (
                      <TableRow key={p.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                        <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                        <TableCell className="text-sm text-[#4A3F36] whitespace-nowrap">{fmtDate(p.createdAt)}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-[#5C3A21]">{p.recipeTitle}</p>
                          {p.observations && <p className="text-xs text-[#8A7E70] line-clamp-1">{p.observations}</p>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{p.cookName || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-[#4A3F36]">{p.placeName}</TableCell>
                        <TableCell className="text-center text-sm text-[#4A3F36] whitespace-nowrap">
                          {p.quantity} <span className="text-xs text-[#8A7E70]">porciones</span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">{fmtCurrency(p.cost)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] ${meta.bg} text-white`}>
                            {p.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {p.status === 'confirmed' && <Check className="h-3 w-3 mr-1" />}
                            {p.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {p.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleConfirm(p)} className="text-[#708238] focus:text-[#708238]"><Check className="h-4 w-4 mr-2" />Confirmar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setRejectItem(p)} className="text-[#B91C1C] focus:text-[#B91C1C]"><X className="h-4 w-4 mr-2" />Rechazar</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openDelete(p)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                                </>
                              )}
                              {p.status === 'confirmed' && (
                                <DropdownMenuItem onClick={() => setDetailItem(p)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                              )}
                              {p.status === 'rejected' && (
                                <>
                                  <DropdownMenuItem onClick={() => setDetailItem(p)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openDelete(p)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ProductionFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        recipes={recipes}
        places={places}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadProductions() }}
      />

      {/* Detail Dialog */}
      <ProductionDetailDialog
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* Reject Dialog */}
      <RejectDialog
        item={rejectItem}
        onClose={() => setRejectItem(null)}
        onDone={() => { setRejectItem(null); loadProductions() }}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar producción?</DialogTitle>
            <DialogDescription>
              Estás por eliminar la producción de <strong>{deleteItem?.recipeTitle}</strong> ({deleteItem?.quantity} porciones)
              con un costo total de <strong>{deleteItem ? fmtCurrency(deleteItem.cost) : ''}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancelar</Button>
            <Button onClick={handleDelete} className="bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white"><Trash2 className="h-4 w-4" />Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Form Dialog — Crear / Editar (max-w-2xl)
// ============================================================

interface ProductionFormDialogProps {
  open: boolean
  mode: FormMode
  item: CmProductionRecord | null
  recipes: RecipeOption[]
  places: PlaceOption[]
  onClose: () => void
  onSaved: () => void
}

function ProductionFormDialog({ open, mode, item, recipes, places, onClose, onSaved }: ProductionFormDialogProps) {
  const [recipeId, setRecipeId] = React.useState<string>('')
  const [placeId, setPlaceId] = React.useState<string>('')
  const [quantity, setQuantity] = React.useState<string>('1')
  const [observations, setObservations] = React.useState('')

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setRecipeId(item.recipeId)
        setPlaceId(item.placeId)
        setQuantity(String(item.quantity || 1))
        setObservations(item.observations || '')
      } else {
        setRecipeId('')
        setPlaceId('')
        setQuantity('1')
        setObservations('')
      }
      setError(null)
    }
  }, [open, mode, item])

  // Costo automático: costPerServing × quantity
  const selectedRecipe = recipes.find((r) => r.id === recipeId)
  const costPerServing = selectedRecipe?.costPerServing ?? 0
  const qtyNum = Number(quantity) || 0
  const totalCost = costPerServing * qtyNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!recipeId) return setError('La receta es obligatoria')
    if (!placeId) return setError('El lugar es obligatorio')
    const q = Number(quantity)
    if (!q || q <= 0) return setError('La cantidad debe ser mayor a 0')

    setSaving(true)
    try {
      const body = {
        recipeId,
        placeId,
        quantity: q,
        observations: observations.trim() || null,
      }
      const url = mode === 'create' ? '/api/cocina-movil/productions' : `/api/cocina-movil/productions/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Producción creada' : 'Producción actualizada')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Factory className="h-5 w-5" />
            {mode === 'create' ? 'Nueva Producción' : 'Editar Producción'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Cargá una nueva producción. El costo se calcula automáticamente según la receta.'
              : `Editando producción de "${item?.recipeTitle}"`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Receta *</Label>
              <Select value={recipeId} onValueChange={setRecipeId}>
                <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Seleccionar receta" /></SelectTrigger>
                <SelectContent>
                  {recipes.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Lugar *</Label>
              <Select value={placeId} onValueChange={setPlaceId}>
                <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Seleccionar lugar" /></SelectTrigger>
                <SelectContent>
                  {places.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Cantidad *</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="border-[#5C3A21]/15"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Observaciones</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Notas internas, ajustes de producción, etc."
              rows={3}
              className="border-[#5C3A21]/15 resize-none"
            />
          </div>

          {/* Cálculo de costos (read-only) */}
          <div className="rounded-lg border border-[#5C3A21]/15 bg-[#FFF8E7]/40 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7E70]">Costos calculados</p>
            {selectedRecipe ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5C3A21]">Costo por porción:</span>
                  <span className="font-semibold text-[#5C3A21]">{fmtCurrency(costPerServing)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5C3A21]">
                    Costo total: {fmtCurrency(costPerServing)} × {qtyNum} = 
                  </span>
                  <span className="font-bold text-[#5C3A21] text-base">{fmtCurrency(totalCost)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#8A7E70] italic">Seleccioná una receta para ver el costo calculado.</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Detail Dialog — Ver Detalle (max-w-3xl)
// ============================================================

interface ProductionDetailDialogProps {
  item: CmProductionRecord | null
  onClose: () => void
}

function ProductionDetailDialog({ item, onClose }: ProductionDetailDialogProps) {
  if (!item) return null
  const meta = STATUS_META[item.status]
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Eye className="h-5 w-5" />Detalle de Producción
          </DialogTitle>
          <DialogDescription>
            Información completa de la producción.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailField label="Fecha" value={fmtDate(item.createdAt)} />
          <DetailField label="Estado">
            <Badge className={`text-[10px] ${meta.bg} text-white`}>{meta.label}</Badge>
          </DetailField>
          <DetailField label="Receta" value={item.recipeTitle} />
          <DetailField label="Cocinero" value={item.cookName || '—'} />
          <DetailField label="Lugar" value={item.placeName} />
          <DetailField label="Cantidad" value={`${item.quantity} porciones`} />
          <DetailField label="Costo por porción" value={fmtCurrency(item.recipeCostPerServing)} />
          <DetailField label="Costo total" value={fmtCurrency(item.cost)} />
          <div className="sm:col-span-2">
            <DetailField label="Observaciones" value={item.observations || '—'} />
          </div>
          {item.status === 'rejected' && (
            <div className="sm:col-span-2">
              <DetailField label="Motivo de rechazo" value={item.rejectionReason || 'Sin motivo especificado'} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="p-3 rounded-md bg-[#FFF8E7]/40 border border-[#5C3A21]/10">
      <p className="text-[10px] uppercase tracking-wide text-[#8A7E70] mb-1">{label}</p>
      {children ? (
        children
      ) : (
        <p className="text-sm font-medium text-[#5C3A21] break-words">{value}</p>
      )}
    </div>
  )
}

// ============================================================
// Reject Dialog — Con motivo de rechazo
// ============================================================

interface RejectDialogProps {
  item: CmProductionRecord | null
  onClose: () => void
  onDone: () => void
}

function RejectDialog({ item, onClose, onDone }: RejectDialogProps) {
  const [reason, setReason] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (item) setReason('')
  }, [item])

  const handleSubmit = async () => {
    if (!item) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cocina-movil/productions/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: reason.trim() || undefined }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      toast.success('Producción rechazada')
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al rechazar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <X className="h-5 w-5 text-[#B91C1C]" />Rechazar Producción
          </DialogTitle>
          <DialogDescription>
            Vas a rechazar la producción de <strong>{item?.recipeTitle}</strong> ({item?.quantity} porciones).
            Podés agregar un motivo opcional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label className="text-[#5C3A21]">Motivo de rechazo (opcional)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Faltó materia prima, error en cantidad, etc."
            rows={4}
            className="border-[#5C3A21]/15 resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white">
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Export (con Suspense)
// ============================================================

export default function CmProduccionesPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmProduccionesPageContent />
    </React.Suspense>
  )
}
