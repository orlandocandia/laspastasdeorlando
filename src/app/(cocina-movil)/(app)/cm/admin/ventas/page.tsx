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
  TrendingUp, X, ClipboardList,
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { SelectWithCreate, type QuickCreateEntity, type SelectOption } from '@/components/(cocina-movil)/admin/select-with-create'

// ============================================================
// Tipos
// ============================================================

interface CmSaleItem {
  id: string
  saleId: string
  recipeId: string
  recipeTitle: string
  quantity: number
  unitPrice: number
  costPerUnit: number
  subtotal: number
  costSubtotal: number
}

interface CmSaleRecord {
  id: string
  ticketNumber: string
  // Datos generales
  saleDate: number
  placeId: string
  placeName: string
  clientName: string | null
  invoiceNumber: string | null
  paymentMethod: string
  observations: string | null
  // Items (multi-receta)
  items: CmSaleItem[]
  // Cálculos (auto)
  totalCost: number
  subtotalPrice: number
  discountType: 'percentage' | 'fixed' | null
  discountValue: number | null
  discountAmount: number
  taxRate: number | null
  taxAmount: number
  totalPrice: number
  profit: number
  profitPercentage: number
  createdAt: number
  updatedAt: number
  // Legacy (compat)
  recipeId: string
  recipeTitle: string
  quantity: number
  unitPrice: number
  costPerUnit: number
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

const PAYMENT_METHODS = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'Mercado Pago', label: 'Mercado Pago' },
  { value: 'Cuenta Corriente', label: 'Cuenta Corriente' },
]

interface FormSaleItem {
  key: string
  recipeId: string
  quantity: number
  unitPrice: number
}

const newItemKey = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `item-${crypto.randomUUID()}`
    : `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const epochToDateInput = (epoch: number): string => {
  const d = new Date(epoch)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateInputToEpoch = (dateStr: string): number => {
  if (!dateStr) return Date.now()
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).getTime()
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
  const [clients, setClients] = React.useState<{ id: string; name: string }[]>([])

  // Carga de recetas, lugares y clientes activos — una sola vez al montar
  React.useEffect(() => {
    const loadRefs = async () => {
      try {
        const [rRes, pRes, cRes] = await Promise.all([
          fetch('/api/cocina-movil/recipes?isActive=true&pageSize=200'),
          fetch('/api/cocina-movil/places?isActive=true&pageSize=200'),
          fetch('/api/cocina-movil/clients?isActive=true&pageSize=200'),
        ])
        const rData = await rRes.json().catch(() => ({}))
        const pData = await pRes.json().catch(() => ({}))
        const cData = await cRes.json().catch(() => ({}))
        setRecipes((rData.recipes || []).map((r: { id: string; title: string; costPerServing: number }) => ({
          id: r.id, title: r.title, costPerServing: r.costPerServing,
        })))
        setPlaces((pData.places || []).map((p: { id: string; name: string }) => ({
          id: p.id, name: p.name,
        })))
        setClients((cData.clients || []).map((c: { id: string; fullName: string }) => ({ id: c.id, name: c.fullName })))
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
                    <TableHead>Recetas</TableHead>
                    <TableHead className="hidden md:table-cell">Lugar</TableHead>
                    <TableHead className="hidden lg:table-cell">Cliente</TableHead>
                    <TableHead className="text-center">Items</TableHead>
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
                        <p className="text-sm font-medium text-[#5C3A21]">
                          {s.items.length > 1 ? `${s.items[0]?.recipeTitle} +${s.items.length - 1}` : s.recipeTitle}
                        </p>
                        {s.observations && <p className="text-xs text-[#8A7E70] line-clamp-1">{s.observations}</p>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{s.placeName}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-[#4A3F36]">{s.clientName || '—'}</TableCell>
                      <TableCell className="text-center text-sm text-[#4A3F36] whitespace-nowrap">
                        <Badge className="bg-[#5C3A21]/10 text-[#5C3A21] hover:bg-[#5C3A21]/15">{s.items.length}</Badge>
                      </TableCell>
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
        clients={clients}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadSales() }}
        onQuickCreated={(entity, record) => {
          if (entity === 'recipe') setRecipes((arr) => [...arr, { id: record.id, title: record.name, costPerServing: 0 }])
          else if (entity === 'place') setPlaces((arr) => [...arr, { id: record.id, name: record.name }])
          else if (entity === 'client') setClients((arr) => [...arr, { id: record.id, name: record.name }])
        }}
      />

      {/* Detail Dialog */}
      <SaleDetailDialog
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onPrint={handlePrintTicket}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
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
  clients: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
  onQuickCreated?: (entity: QuickCreateEntity, record: SelectOption) => void
}

function SaleFormDialog({ open, mode, item, recipes, places, clients, onClose, onSaved, onQuickCreated }: SaleFormDialogProps) {
  const [placeId, setPlaceId] = React.useState<string>('')
  const [saleDate, setSaleDate] = React.useState<string>(epochToDateInput(Date.now()))
  const [clientName, setClientName] = React.useState('')
  const [clientId, setClientId] = React.useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<string>('Efectivo')
  const [discountType, setDiscountType] = React.useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = React.useState<string>('')
  const [taxRate, setTaxRate] = React.useState<string>('')
  const [observations, setObservations] = React.useState('')
  const [selectedClientOrderId, setSelectedClientOrderId] = React.useState<string | null>(null)
  const [selectedBudgetId, setSelectedBudgetId] = React.useState<string | null>(null)
  const [items, setItems] = React.useState<FormSaleItem[]>([])

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setSelectedClientOrderId(null)
      setSelectedBudgetId(null)
      setClientId('')
      if (mode === 'edit' && item) {
        setPlaceId(item.placeId)
        setSaleDate(epochToDateInput(item.saleDate))
        setClientName(item.clientName || '')
        setClientId('') // edit mode: no client id, just the name snapshot
        setInvoiceNumber(item.invoiceNumber || '')
        setPaymentMethod(item.paymentMethod || 'Efectivo')
        setDiscountType(item.discountType || 'percentage')
        setDiscountValue(item.discountValue != null ? String(item.discountValue) : '')
        setTaxRate(item.taxRate != null ? String(item.taxRate) : '')
        setObservations(item.observations || '')
        setItems(item.items.map((it) => ({
          key: newItemKey(),
          recipeId: it.recipeId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })))
      } else {
        setPlaceId('')
        setSaleDate(epochToDateInput(Date.now()))
        setClientName('')
        setInvoiceNumber('')
        setPaymentMethod('Efectivo')
        setDiscountType('percentage')
        setDiscountValue('')
        setTaxRate('')
        setObservations('')
        setItems([{ key: newItemKey(), recipeId: '', quantity: 1, unitPrice: 0 }])
      }
      setError(null)
    }
  }, [open, mode, item])

  // Cálculo automático de costos en tiempo real
  const recipeCostMap = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const r of recipes) m.set(r.id, r.costPerServing)
    return m
  }, [recipes])

  const computedItems = items.map((it) => {
    const costPerUnit = recipeCostMap.get(it.recipeId) ?? 0
    return {
      ...it,
      costPerUnit,
      subtotal: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      costSubtotal: (Number(it.quantity) || 0) * costPerUnit,
    }
  })

  const totalCost = computedItems.reduce((sum, it) => sum + it.costSubtotal, 0)
  const subtotalPrice = computedItems.reduce((sum, it) => sum + it.subtotal, 0)

  const dv = Number(discountValue) || 0
  let discountAmount = 0
  if (dv > 0) {
    discountAmount = discountType === 'percentage' ? subtotalPrice * (dv / 100) : Math.min(dv, subtotalPrice)
  }
  const afterDiscount = subtotalPrice - discountAmount

  const tr = Number(taxRate) || 0
  const taxAmount = tr > 0 ? afterDiscount * (tr / 100) : 0
  const totalPrice = afterDiscount + taxAmount
  const profit = totalPrice - totalCost
  const profitPercentage = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

  const addItem = () => {
    setItems((arr) => [...arr, { key: newItemKey(), recipeId: '', quantity: 1, unitPrice: 0 }])
  }
  const removeItem = (key: string) => setItems((arr) => arr.filter((it) => it.key !== key))
  const updateItem = (key: string, patch: Partial<FormSaleItem>) =>
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const onRecipeSelect = (key: string, recipeId: string) => {
    const r = recipes.find((x) => x.id === recipeId)
    updateItem(key, { recipeId, unitPrice: r ? Math.round(r.costPerServing * 2) : 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!placeId) return setError('El lugar es obligatorio')
    const validItems = items.filter((it) => it.recipeId && Number(it.quantity) > 0)
    if (validItems.length === 0) return setError('Debe agregar al menos un item con receta y cantidad')
    for (const it of validItems) {
      if (Number(it.unitPrice) < 0) return setError('El precio no puede ser negativo')
    }

    setSaving(true)
    try {
      const body = {
        placeId,
        saleDate: dateInputToEpoch(saleDate),
        clientName: clientName.trim() || null,
        invoiceNumber: invoiceNumber.trim() || null,
        paymentMethod,
        observations: observations.trim() || null,
        items: validItems.map((it) => ({
          recipeId: it.recipeId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
        discountType: dv > 0 ? discountType : null,
        discountValue: dv > 0 ? dv : null,
        taxRate: tr > 0 ? tr : null,
        budgetId: selectedBudgetId,
      }
      const url = mode === 'create' ? '/api/cocina-movil/sales' : `/api/cocina-movil/sales/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)

      // If this sale came from a client order, mark it as vendido
      if (selectedClientOrderId && data.sale?.id) {
        await fetch(`/api/cocina-movil/client-orders/${selectedClientOrderId}/convert-to-sale`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: data.sale.id }),
        }).catch(() => {}) // non-fatal
      }

      // If this sale came from a budget, link it
      if (selectedBudgetId && data.sale?.id) {
        await fetch(`/api/cocina-movil/budgets/${selectedBudgetId}/convert-to-sale`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: data.sale.id }),
        }).catch(() => {}) // non-fatal
      }

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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {mode === 'create' ? 'Nueva Venta' : 'Editar Venta'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Cargá una venta con múltiples recetas. El costo y margen se calculan automáticamente.'
              : `Editando venta ${item?.ticketNumber ? `(${item.ticketNumber})` : ''}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-6">
            {error && (
              <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
            )}

            {/* ============ SECCIÓN 1: Datos de la Venta ============ */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-semibold text-[#5C3A21]">Datos de la Venta</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Fecha de venta</Label>
                  <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="border-[#5C3A21]/15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Cliente</Label>
                  <SelectWithCreate
                    entity="client"
                    value={clientId || '__none__'}
                    onValueChange={(v) => {
                      if (v === '__none__') { setClientId(''); setClientName('') }
                      else {
                        setClientId(v)
                        const c = clients.find((cl) => cl.id === v)
                        setClientName(c?.name || '')
                      }
                    }}
                    options={clients}
                    placeholder="Seleccionar cliente"
                    allowNone
                    noneLabel="Consumidor Final"
                    onCreated={(r) => onQuickCreated?.('client', r)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Lugar *</Label>
                  <SelectWithCreate
                    entity="place"
                    value={placeId}
                    onValueChange={setPlaceId}
                    options={places}
                    placeholder="Seleccionar lugar"
                    onCreated={(r) => onQuickCreated?.('place', r)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">N° de ticket / factura</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Opcional" className="border-[#5C3A21]/15" />
                </div>
              </div>
            </div>

            {/* Cargar desde Pedido de Cliente */}
            {mode === 'create' && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-[#5C3A21]/15 bg-[#FBF1DC]/50">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#5C3A21]" />
                  <span className="text-sm text-[#5C3A21]">¿Querés cargar desde un Pedido de Cliente?</span>
                </div>
                <PendingClientOrdersButton onLoadOrder={(order) => {
                  setClientName(order.clientName || '')
                  setSelectedClientOrderId(order.id)
                  setItems(order.items.map((it: { recipeId: string; quantity: number; unitPrice: number }) => ({
                    key: newItemKey(), recipeId: it.recipeId, quantity: it.quantity, unitPrice: it.unitPrice,
                  })))
                  toast.success(`Pedido ${order.orderNumber} cargado en la venta`)
                }} />
              </div>
            )}

            {/* Cargar desde Presupuesto */}
            {mode === 'create' && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-[#5C3A21]/15 bg-[#FBF1DC]/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#5C3A21]" />
                  <span className="text-sm text-[#5C3A21]">¿Querés cargar desde un Presupuesto?</span>
                </div>
                <PendingBudgetsButton onLoadBudget={(budget) => {
                  setClientName(budget.clientName || '')
                  setItems(budget.items.map((it: { recipeId: string; quantity: number; unitPrice: number }) => ({
                    key: newItemKey(), recipeId: it.recipeId, quantity: it.quantity, unitPrice: it.unitPrice,
                  })))
                  setDiscountType(budget.discountType === 'fixed' ? 'fixed' : 'percentage')
                  setDiscountValue(budget.discountValue != null ? String(budget.discountValue) : '')
                  setTaxRate(budget.taxRate != null ? String(budget.taxRate) : '')
                  setSelectedBudgetId(budget.id)
                  toast.success(`Presupuesto cargado en la venta`)
                }} />
              </div>
            )}

            <Separator />

            {/* ============ SECCIÓN 2: Detalle de Venta ============ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-sm font-semibold text-[#5C3A21]">Detalle de Venta</h3>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="border-[#5C3A21]/20 text-[#5C3A21]">
                  <Plus className="h-3.5 w-3.5" />Agregar Item
                </Button>
              </div>
              <div className="space-y-2 pl-10">
                {/* Header (desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-[#8A7E70]">
                  <div className="col-span-5">Receta</div>
                  <div className="col-span-2 text-right">Cantidad</div>
                  <div className="col-span-2 text-right">Precio/U</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1" />
                </div>
                {items.map((it) => {
                  const r = recipes.find((x) => x.id === it.recipeId)
                  const costPerUnit = r?.costPerServing ?? 0
                  const subtotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                  return (
                    <div key={it.key} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
                      <div className="sm:col-span-5">
                        <Label className="text-[10px] text-[#8A7E70] sm:hidden">Receta</Label>
                        <SelectWithCreate
                          entity="recipe"
                          value={it.recipeId}
                          onValueChange={(v) => onRecipeSelect(it.key, v)}
                          options={recipes.map((rc) => ({ id: rc.id, name: rc.title }))}
                          placeholder="Seleccionar receta…"
                          compact
                          triggerClassName="h-9 border-[#5C3A21]/15 text-xs"
                          onCreated={(rec) => onQuickCreated?.('recipe', rec)}
                        />
                        {r && <p className="text-[10px] text-[#8A7E70] mt-0.5">Costo: {fmtCurrency(costPerUnit)}/u</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] sm:hidden">Cantidad</Label>
                        <Input type="number" min="0" step="any" value={it.quantity} onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) })} className="h-9 border-[#5C3A21]/15 text-xs text-right" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] sm:hidden">Precio/U</Label>
                        <Input type="number" min="0" step="0.01" value={it.unitPrice} onChange={(e) => updateItem(it.key, { unitPrice: Number(e.target.value) })} className="h-9 border-[#5C3A21]/15 text-xs text-right" />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-end">
                        <span className="text-sm font-semibold text-[#5C3A21]">{fmtCurrency(subtotal)}</span>
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-center">
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(it.key)} className="h-8 w-8 text-[#B91C1C] hover:bg-[#B91C1C]/10">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* ============ SECCIÓN 3: Pago ============ */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="text-sm font-semibold text-[#5C3A21]">Pago</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-10">
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Forma de pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Tipo descuento</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                    <SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Descuento</Label>
                  <Input type="number" min="0" step="any" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? 'Ej: 10' : 'Ej: 500'} className="border-[#5C3A21]/15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">IVA (%)</Label>
                  <Input type="number" min="0" step="any" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="Ej: 21" className="border-[#5C3A21]/15" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[#5C3A21]">Observaciones</Label>
                  <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Notas internas, condiciones, etc." rows={2} className="border-[#5C3A21]/15 resize-none" />
                </div>
              </div>
            </div>

            <Separator />

            {/* ============ SECCIÓN 4: Panel de cálculo ============ */}
            <div className="rounded-lg border border-[#5C3A21]/15 bg-[#FFF8E7]/40 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7E70] flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />Cálculo
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5C3A21]">Costo total ({items.length} items):</span>
                <span className="font-semibold text-[#5C3A21]">{fmtCurrency(totalCost)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5C3A21]">Subtotal (precio de venta):</span>
                <span className="font-semibold text-[#5C3A21]">{fmtCurrency(subtotalPrice)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#B91C1C]">Descuento ({discountType === 'percentage' ? `${dv}%` : 'fijo'}):</span>
                  <span className="font-semibold text-[#B91C1C]">−{fmtCurrency(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5C3A21]">IVA ({tr}%):</span>
                  <span className="font-semibold text-[#5C3A21]">+{fmtCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t border-[#5C3A21]/15">
                <span className="text-[#5C3A21] font-semibold">Total final:</span>
                <span className="font-bold text-[#5C3A21] text-lg">{fmtCurrency(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5C3A21]">Ganancia:</span>
                <span className="font-bold text-[#5C3A21]">{fmtCurrency(profit)}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t border-[#5C3A21]/15">
                <span className="text-[#5C3A21] flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />Margen real:
                </span>
                <span className={`text-base ${marginColor(profitPercentage)}`}>{fmtPercent(profitPercentage)}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-white border-t border-[#5C3A21]/10 px-6 py-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </div>
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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
// Pending Client Orders Button (cargar desde pedido de cliente)
// ============================================================

interface PendingClientOrder {
  id: string
  orderNumber: string
  clientName: string | null
  orderDate: number
  items: Array<{ recipeId: string; quantity: number; unitPrice: number }>
  total: number
  status: string
  saleId?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', en_preparacion: 'En preparación', entregado: 'Entregado', vendido: 'Vendido', cancelado: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-[#8A7E70]', en_preparacion: 'bg-[#E1AD01]', entregado: 'bg-blue-500', vendido: 'bg-[#708238]', cancelado: 'bg-[#B91C1C]',
}

function PendingClientOrdersButton({ onLoadOrder }: { onLoadOrder: (order: PendingClientOrder) => void }) {
  const [open, setOpen] = React.useState(false)
  const [orders, setOrders] = React.useState<PendingClientOrder[]>([])
  const [loading, setLoading] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
    setLoading(true)
    // Fetch all orders, then filter out vendido/cancelado and those with saleId
    fetch('/api/cocina-movil/client-orders?pageSize=200')
      .then((r) => r.json().catch(() => ({ orders: [] })))
      .then((data) => {
        const all = (data.orders || []) as PendingClientOrder[]
        setOrders(all.filter((o) => o.status !== 'vendido' && o.status !== 'cancelado' && !o.saleId))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={handleOpen} className="border-[#5C3A21]/20 text-[#5C3A21]">
        Ver Pedidos Disponibles
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Pedidos de Clientes Disponibles
            </DialogTitle>
            <DialogDescription>Seleccioná un pedido para cargar sus items en esta venta.</DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No hay pedidos disponibles para vender.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 p-3 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-[#5C3A21] hover:bg-[#5C3A21] text-white font-mono">{o.orderNumber}</Badge>
                      <span className="text-sm font-medium text-[#5C3A21] truncate">{o.clientName || 'Cliente'}</span>
                      <Badge className={`text-[9px] ${STATUS_COLORS[o.status] || 'bg-gray-500'} text-white`}>{STATUS_LABELS[o.status] || o.status}</Badge>
                    </div>
                    <p className="text-xs text-[#8A7E70] mt-1">
                      {o.items.length} items · Total: {fmtCurrency(o.total)}
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={() => { onLoadOrder(o); setOpen(false) }} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611] shrink-0">
                    Cargar
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================
// ============================================================
// Pending Budgets Button (cargar desde presupuesto aprobado)
// ============================================================

interface PendingBudget {
  id: string
  clientName: string | null
  budgetDate: number
  items: Array<{ recipeId: string; quantity: number; unitPrice: number }>
  total: number
  totalPrice: number
  discountType: 'percentage' | 'fixed' | null
  discountValue: number | null
  taxRate: number | null
  status: string
  saleId: string | null
}

function PendingBudgetsButton({ onLoadBudget }: { onLoadBudget: (budget: PendingBudget) => void }) {
  const [open, setOpen] = React.useState(false)
  const [budgets, setBudgets] = React.useState<PendingBudget[]>([])
  const [loading, setLoading] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
    setLoading(true)
    fetch('/api/cocina-movil/budgets?pageSize=200')
      .then((r) => r.json().catch(() => ({ budgets: [] })))
      .then((data) => {
        const all = (data.budgets || []) as PendingBudget[]
        setBudgets(all.filter((b) => b.status === 'aprobado' && !b.saleId))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={handleOpen} className="border-[#5C3A21]/20 text-[#5C3A21]">
        Ver Presupuestos Aprobados
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Presupuestos Aprobados
            </DialogTitle>
            <DialogDescription>Seleccioná un presupuesto para cargar sus items en esta venta.</DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" /></div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No hay presupuestos aprobados disponibles.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {budgets.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#5C3A21] truncate block">{b.clientName || 'Cliente'}</span>
                    <p className="text-xs text-[#8A7E70] mt-1">
                      {b.items.length} items · Total: {fmtCurrency(b.totalPrice || b.total)}
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={() => { onLoadBudget(b); setOpen(false) }} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611] shrink-0">
                    Cargar
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
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
