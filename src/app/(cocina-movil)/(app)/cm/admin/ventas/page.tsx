'use client'

/**
 * ============================================================
 * Ventas — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/ventas
 * Gestión de ventas con cálculo de márgenes e impresión de
 * tickets térmicos (80mm o 58mm según printer settings).
 * - Edición solo dentro de las primeras 24 h de creada.
 * - Eliminación sin restricciones.
 * - Impresión de ticket vía POST /api/cocina-movil/print/ticket.
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2, Eye, ShoppingBag,
  TrendingUp,
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

interface CmSaleRecord {
  id: string
  ticketNumber: string
  recipeId: string
  recipeTitle: string
  placeId: string
  placeName: string
  clientName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  costPerUnit: number
  totalCost: number
  profit: number
  profitPercentage: number
  saleDate: number
  observations: string | null
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

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (value: number): string =>
  `$${Number(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

const fmtPercent = (value: number): string =>
  `${Number(value || 0).toFixed(1)}%`

const fmtDate = (ts: number): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const marginColor = (p: number): string => {
  if (p > 30) return 'text-[#708238] font-semibold'
  if (p >= 10) return 'text-[#E1AD01] font-semibold'
  return 'text-[#B91C1C] font-semibold'
}

const isEditable = (sale: CmSaleRecord): boolean =>
  Date.now() - sale.createdAt < 24 * 60 * 60 * 1000

// ============================================================
// Página
// ============================================================

function CmVentasPageContent() {
  const searchParams = useSearchParams()
  const [sales, setSales] = React.useState<CmSaleRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmSaleRecord | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmSaleRecord | null>(null)
  const [detailItem, setDetailItem] = React.useState<CmSaleRecord | null>(null)

  const [recipes, setRecipes] = React.useState<RecipeOption[]>([])
  const [places, setPlaces] = React.useState<PlaceOption[]>([])

  // Carga de recetas y lugares activos — una sola vez al montar
  React.useEffect(() => {
    const loadRefs = async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          fetch('/api/cocina-movil/recipes?isActive=true&pageSize=200'),
          fetch('/api/cocina-movil/places?isActive=true&pageSize=200'),
        ])
        const rData = await rRes.json().catch(() => ({}))
        const pData = await pRes.json().catch(() => ({}))
        setRecipes((rData.recipes || []).map((r: { id: string; title: string; costPerServing: number }) => ({
          id: r.id, title: r.title, costPerServing: r.costPerServing,
        })))
        setPlaces((pData.places || []).map((p: { id: string; name: string }) => ({
          id: p.id, name: p.name,
        })))
      } catch (err) {
        console.error('Error cargando referencias:', err)
      }
    }
    loadRefs()
  }, [])

  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormMode('create')
      setEditItem(null)
      setFormOpen(true)
    }
  }, [searchParams])

  const loadSales = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('pageSize', '200')
      params.set('sortBy', 'saleDate')
      params.set('sortOrder', 'desc')
      const res = await fetch(`/api/cocina-movil/sales?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setSales(data.sales || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }, [search])

  React.useEffect(() => {
    const id = setTimeout(loadSales, 250)
    return () => clearTimeout(id)
  }, [loadSales])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }

  const openEdit = (item: CmSaleRecord) => {
    if (!isEditable(item)) {
      toast.error('No se puede editar una venta con más de 24 horas de creada.')
      return
    }
    setFormMode('edit')
    setEditItem(item)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/sales/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      toast.success('Venta eliminada')
      setDeleteItem(null)
      loadSales()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handlePrintTicket = async (sale: CmSaleRecord) => {
    const toastId = toast.loading('Generando ticket…')
    try {
      const res = await fetch('/api/cocina-movil/print/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: sale.id }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      const data = await res.json()
      const ticket: string = data.ticket || ''
      const settings = data.settings || {}
      const widthMm: string = settings.ticketWidth === '58mm' ? '58mm' : '80mm'
      openTicketWindow(ticket, widthMm, sale.ticketNumber)
      toast.success(`Ticket ${sale.ticketNumber} enviado a impresión`, { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al imprimir ticket', { id: toastId })
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    window.open(`/api/cocina-movil/sales/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />Ventas
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nueva Venta
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por receta, cliente o ticket…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            <div className="flex items-center text-xs text-[#8A7E70] md:justify-end">
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              Las ventas solo pueden editarse dentro de las primeras 24 h.
            </div>
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
          ) : sales.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron ventas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Receta</TableHead>
                    <TableHead className="hidden md:table-cell">Lugar</TableHead>
                    <TableHead className="hidden lg:table-cell">Cliente</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Margen %</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s, i) => (
                    <TableRow key={s.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        <Badge className="text-[10px] bg-[#5C3A21] hover:bg-[#5C3A21] text-white font-mono">
                          {s.ticketNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[#4A3F36] whitespace-nowrap">{fmtDate(s.saleDate)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[#5C3A21]">{s.recipeTitle}</p>
                        {s.observations && <p className="text-xs text-[#8A7E70] line-clamp-1">{s.observations}</p>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{s.placeName}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-[#4A3F36]">{s.clientName || '—'}</TableCell>
                      <TableCell className="text-center text-sm text-[#4A3F36] whitespace-nowrap">{s.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">{fmtCurrency(s.totalPrice)}</TableCell>
                      <TableCell className={`text-right text-sm whitespace-nowrap ${marginColor(s.profitPercentage)}`}>
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {fmtPercent(s.profitPercentage)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailItem(s)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintTicket(s)} className="text-[#5C3A21] focus:text-[#5C3A21]"><Printer className="h-4 w-4 mr-2" />Imprimir Ticket</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(s)} disabled={!isEditable(s)}>
                              <Pencil className="h-4 w-4 mr-2" />Editar
                              {!isEditable(s) && <span className="ml-auto text-[10px] text-[#8A7E70]">+24h</span>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(s)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <SaleFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        recipes={recipes}
        places={places}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadSales() }}
      />

      {/* Detail Dialog */}
      <SaleDetailDialog
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onPrint={handlePrintTicket}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar venta?</DialogTitle>
            <DialogDescription>
              Estás por eliminar la venta <strong>{deleteItem?.ticketNumber}</strong> de{' '}
              <strong>{deleteItem?.recipeTitle}</strong> ({deleteItem?.quantity} u.) por un total de{' '}
              <strong>{deleteItem ? fmtCurrency(deleteItem.totalPrice) : ''}</strong>. Esta acción no se puede deshacer.
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

interface SaleFormDialogProps {
  open: boolean
  mode: FormMode
  item: CmSaleRecord | null
  recipes: RecipeOption[]
  places: PlaceOption[]
  onClose: () => void
  onSaved: () => void
}

function SaleFormDialog({ open, mode, item, recipes, places, onClose, onSaved }: SaleFormDialogProps) {
  const [recipeId, setRecipeId] = React.useState<string>('')
  const [placeId, setPlaceId] = React.useState<string>('')
  const [clientName, setClientName] = React.useState('')
  const [quantity, setQuantity] = React.useState<string>('1')
  const [unitPrice, setUnitPrice] = React.useState<string>('0')
  const [observations, setObservations] = React.useState('')

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setRecipeId(item.recipeId)
        setPlaceId(item.placeId)
        setClientName(item.clientName || '')
        setQuantity(String(item.quantity || 1))
        setUnitPrice(String(item.unitPrice ?? 0))
        setObservations(item.observations || '')
      } else {
        setRecipeId('')
        setPlaceId('')
        setClientName('')
        setQuantity('1')
        setUnitPrice('0')
        setObservations('')
      }
      setError(null)
    }
  }, [open, mode, item])

  // Cálculo automático de costos y márgenes en tiempo real
  const selectedRecipe = recipes.find((r) => r.id === recipeId)
  const costPerUnit = selectedRecipe?.costPerServing ?? 0
  const qtyNum = Number(quantity) || 0
  const priceNum = Number(unitPrice) || 0

  const totalCost = costPerUnit * qtyNum
  const totalPrice = priceNum * qtyNum
  const profit = totalPrice - totalCost
  const profitPercentage = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!recipeId) return setError('La receta es obligatoria')
    if (!placeId) return setError('El lugar es obligatorio')
    const q = Number(quantity)
    if (!q || q <= 0) return setError('La cantidad debe ser mayor a 0')
    const p = Number(unitPrice)
    if (isNaN(p) || p <= 0) return setError('El precio de venta debe ser mayor a 0')

    setSaving(true)
    try {
      const body = {
        recipeId,
        placeId,
        clientName: clientName.trim() || null,
        quantity: q,
        unitPrice: p,
        observations: observations.trim() || null,
      }
      const url = mode === 'create' ? '/api/cocina-movil/sales' : `/api/cocina-movil/sales/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Venta creada' : 'Venta actualizada')
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
            <ShoppingBag className="h-5 w-5" />
            {mode === 'create' ? 'Nueva Venta' : 'Editar Venta'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Cargá una nueva venta. El margen se calcula automáticamente según la receta y el precio.'
              : `Editando venta ${item?.ticketNumber ? `(${item.ticketNumber})` : ''}`}
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Cliente</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Opcional"
              className="border-[#5C3A21]/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Precio de venta por unidad *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="border-[#5C3A21]/15"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Observaciones</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Notas internas, forma de pago, etc."
              rows={3}
              className="border-[#5C3A21]/15 resize-none"
            />
          </div>

          {/* Cálculo de costos y margen (read-only, en tiempo real) */}
          <div className="rounded-lg border border-[#5C3A21]/15 bg-[#FFF8E7]/40 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7E70] flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />Cálculo de margen
            </p>
            {selectedRecipe ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5C3A21]">Costo unitario:</span>
                  <span className="font-semibold text-[#5C3A21]">{fmtCurrency(costPerUnit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5C3A21]">
                    Costo total: {fmtCurrency(costPerUnit)} × {qtyNum} =
                  </span>
                  <span className="font-semibold text-[#5C3A21]">{fmtCurrency(totalCost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5C3A21]">
                    Precio total: {fmtCurrency(priceNum)} × {qtyNum} =
                  </span>
                  <span className="font-semibold text-[#5C3A21]">{fmtCurrency(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5C3A21]">
                    Ganancia: {fmtCurrency(totalPrice)} − {fmtCurrency(totalCost)} =
                  </span>
                  <span className="font-bold text-[#5C3A21] text-base">{fmtCurrency(profit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t border-[#5C3A21]/15">
                  <span className="text-[#5C3A21] flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Margen:
                  </span>
                  <span className={`text-base ${marginColor(profitPercentage)}`}>{fmtPercent(profitPercentage)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#8A7E70] italic">Seleccioná una receta para ver el cálculo de margen.</p>
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

interface SaleDetailDialogProps {
  item: CmSaleRecord | null
  onClose: () => void
  onPrint: (sale: CmSaleRecord) => void
}

function SaleDetailDialog({ item, onClose, onPrint }: SaleDetailDialogProps) {
  if (!item) return null
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Eye className="h-5 w-5" />Detalle de Venta
          </DialogTitle>
          <DialogDescription>
            Información completa de la venta <strong>{item.ticketNumber}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailField label="Ticket #">
            <Badge className="text-[10px] bg-[#5C3A21] hover:bg-[#5C3A21] text-white font-mono">{item.ticketNumber}</Badge>
          </DetailField>
          <DetailField label="Fecha" value={fmtDate(item.saleDate)} />
          <DetailField label="Receta" value={item.recipeTitle} />
          <DetailField label="Lugar" value={item.placeName} />
          <DetailField label="Cliente" value={item.clientName || '—'} />
          <DetailField label="Cantidad" value={`${item.quantity}`} />
          <DetailField label="Precio unitario" value={fmtCurrency(item.unitPrice)} />
          <DetailField label="Total" value={fmtCurrency(item.totalPrice)} />
          <DetailField label="Costo total" value={fmtCurrency(item.totalCost)} />
          <DetailField label="Ganancia" value={fmtCurrency(item.profit)} />
          <DetailField label="Margen %">
            <span className={`text-sm font-semibold ${marginColor(item.profitPercentage)}`}>
              {fmtPercent(item.profitPercentage)}
            </span>
          </DetailField>
          <DetailField label="Estado">
            <Badge className={`text-[10px] ${isEditable(item) ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#8A7E70] hover:bg-[#8A7E70]'} text-white`}>
              {isEditable(item) ? 'Editable' : 'Cerrada (+24h)'}
            </Badge>
          </DetailField>
          <div className="sm:col-span-2">
            <DetailField label="Observaciones" value={item.observations || '—'} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={() => onPrint(item)} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
            <Printer className="h-4 w-4" />Imprimir Ticket
          </Button>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
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
// Ticket printing — abre una nueva ventana con el ticket
// térmico en monospace y dispara window.print().
// ============================================================

function openTicketWindow(ticket: string, widthMm: string, ticketNumber: string) {
  // Escapar el texto del ticket para insertarlo de forma segura en <pre>.
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ticket ${ticketNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: #f4f4f4;
      font-family: 'Courier New', 'Consolas', monospace;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 16px;
    }
    .ticket {
      background: #ffffff;
      padding: 12px 14px;
      width: ${widthMm};
      max-width: ${widthMm};
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .ticket pre {
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 11px;
      line-height: 1.35;
      white-space: pre-wrap;
      word-break: break-word;
      text-align: center;
      color: #000;
    }
    @media print {
      html, body { background: #fff; padding: 0; }
      .ticket {
        width: ${widthMm};
        max-width: ${widthMm};
        box-shadow: none;
        border-radius: 0;
        padding: 4px 6px;
      }
      .ticket pre { font-size: 11px; }
      @page { margin: 0; size: ${widthMm} auto; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <pre>${escapeHtml(ticket)}</pre>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 250);
    };
  </script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) {
    toast.error('No se pudo abrir la ventana de impresión. Revisá el bloqueador de pop-ups.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}

// ============================================================
// Export (con Suspense)
// ============================================================

export default function CmVentasPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmVentasPageContent />
    </React.Suspense>
  )
}
