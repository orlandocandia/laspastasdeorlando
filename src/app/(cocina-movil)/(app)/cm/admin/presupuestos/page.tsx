'use client'

/**
 * ============================================================
 * Presupuestos — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/presupuestos
 * Gestión de presupuestos con workflow de 4 estados:
 *   borrador → enviado → aprobado | rechazado
 * - Cálculo automático de márgenes (profitPercentage = profit / totalPrice × 100).
 * - Solo los presupuestos "borrador" pueden editarse.
 * - "borrador" admite Editar / Enviar / Eliminar.
 * - "enviado" admite Ver Detalle / Aprobar / Rechazar.
 * - "aprobado" solo admite Ver Detalle (es final).
 * - "rechazado" admite Ver Detalle / Eliminar.
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2,
  Eye, Check, X, Send, TrendingUp,
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

type CmBudgetStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado'

interface CmBudgetItem {
  id: string
  budgetId: string
  recipeId: string
  recipeTitle: string
  quantity: number
  unitPrice: number
  costPerUnit: number
  subtotal: number
  costSubtotal: number
}

interface CmBudgetRecord {
  id: string
  // Datos generales
  budgetDate: number
  clientName: string | null
  validityDays: number | null
  budgetNumber: string | null
  observations: string | null
  // Items (multi-receta)
  items: CmBudgetItem[]
  // Cálculos (auto)
  totalCost: number
  subtotal: number
  discountType: 'percentage' | 'fixed' | null
  discountValue: number | null
  discountAmount: number
  taxRate: number | null
  taxAmount: number
  totalPrice: number
  profit: number
  profitPercentage: number
  status: CmBudgetStatus
  createdAt: number
  updatedAt: number
  // Legacy (compat)
  recipeId: string
  recipeTitle: string
  recipeCostPerServing: number
  servings: number
  pricePerServing: number
}

interface RecipeOption {
  id: string
  title: string
  costPerServing: number
}

type FormMode = 'create' | 'edit'
type StatusFilter = 'all' | CmBudgetStatus

// ============================================================
// Constantes
// ============================================================

const STATUS_META: Record<CmBudgetStatus, { label: string; bg: string }> = {
  borrador: { label: 'Borrador', bg: 'bg-[#8A7E70] hover:bg-[#8A7E70]' },
  enviado: { label: 'Enviado', bg: 'bg-[#E1AD01] hover:bg-[#E1AD01]' },
  aprobado: { label: 'Aprobado', bg: 'bg-[#708238] hover:bg-[#708238]' },
  rechazado: { label: 'Rechazado', bg: 'bg-[#B91C1C] hover:bg-[#B91C1C]' },
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borradores' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'rechazado', label: 'Rechazados' },
]

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

interface FormBudgetItem {
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

const VALIDITY_DAYS_OPTIONS = [7, 15, 30, 60, 90]

// ============================================================
// Página
// ============================================================

function CmPresupuestosPageContent() {
  const searchParams = useSearchParams()
  const [budgets, setBudgets] = React.useState<CmBudgetRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmBudgetRecord | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmBudgetRecord | null>(null)
  const [detailItem, setDetailItem] = React.useState<CmBudgetRecord | null>(null)

  const [recipes, setRecipes] = React.useState<RecipeOption[]>([])

  // Carga de recetas activas — una sola vez al montar
  React.useEffect(() => {
    const loadRecipes = async () => {
      try {
        const rRes = await fetch('/api/cocina-movil/recipes?isActive=true&pageSize=200')
        const rData = await rRes.json().catch(() => ({}))
        setRecipes((rData.recipes || []).map((r: { id: string; title: string; costPerServing: number }) => ({
          id: r.id, title: r.title, costPerServing: r.costPerServing,
        })))
      } catch (err) {
        console.error('Error cargando recetas:', err)
      }
    }
    loadRecipes()
  }, [])

  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormMode('create')
      setEditItem(null)
      setFormOpen(true)
    }
  }, [searchParams])

  const loadBudgets = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('pageSize', '200')
      params.set('sortBy', 'createdAt')
      params.set('sortOrder', 'desc')
      const res = await fetch(`/api/cocina-movil/budgets?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setBudgets(data.budgets || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar presupuestos')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  React.useEffect(() => {
    const id = setTimeout(loadBudgets, 250)
    return () => clearTimeout(id)
  }, [loadBudgets])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }

  const openEdit = (item: CmBudgetRecord) => {
    if (item.status !== 'borrador') {
      toast.error('Solo los presupuestos en borrador pueden editarse.')
      return
    }
    setFormMode('edit')
    setEditItem(item)
    setFormOpen(true)
  }

  const openDelete = (item: CmBudgetRecord) => {
    if (item.status !== 'borrador' && item.status !== 'rechazado') {
      toast.error('Solo se pueden eliminar presupuestos en borrador o rechazados.')
      return
    }
    setDeleteItem(item)
  }

  const handleStatusChange = async (item: CmBudgetRecord, newStatus: CmBudgetStatus) => {
    try {
      const res = await fetch(`/api/cocina-movil/budgets/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      const labelMap: Record<CmBudgetStatus, string> = {
        borrador: 'Borrador',
        enviado: 'Enviado',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado',
      }
      toast.success(`Presupuesto marcado como "${labelMap[newStatus]}"`)
      loadBudgets()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/budgets/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      toast.success('Presupuesto eliminado')
      setDeleteItem(null)
      loadBudgets()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    window.open(`/api/cocina-movil/budgets/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <FileText className="h-6 w-6" />Presupuestos
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nuevo Presupuesto
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por receta o cliente…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
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
          ) : budgets.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron presupuestos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Recetas</TableHead>
                    <TableHead className="hidden md:table-cell">Cliente</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Margen %</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((b, i) => {
                    const meta = STATUS_META[b.status]
                    return (
                      <TableRow key={b.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                        <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                        <TableCell className="text-sm text-[#4A3F36] whitespace-nowrap">{fmtDate(b.budgetDate)}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-[#5C3A21]">
                            {b.items.length > 1 ? `${b.items[0]?.recipeTitle} +${b.items.length - 1}` : b.recipeTitle}
                          </p>
                          {b.observations && <p className="text-xs text-[#8A7E70] line-clamp-1">{b.observations}</p>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{b.clientName || '—'}</TableCell>
                        <TableCell className="text-center text-sm text-[#4A3F36] whitespace-nowrap">
                          <Badge className="bg-[#5C3A21]/10 text-[#5C3A21] hover:bg-[#5C3A21]/15">{b.items.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">{fmtCurrency(b.totalPrice)}</TableCell>
                        <TableCell className={`text-right text-sm whitespace-nowrap ${marginColor(b.profitPercentage)}`}>
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {fmtPercent(b.profitPercentage)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] ${meta.bg} text-white`}>
                            {b.status === 'borrador' && <FileText className="h-3 w-3 mr-1" />}
                            {b.status === 'enviado' && <Send className="h-3 w-3 mr-1" />}
                            {b.status === 'aprobado' && <Check className="h-3 w-3 mr-1" />}
                            {b.status === 'rechazado' && <X className="h-3 w-3 mr-1" />}
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {b.status === 'borrador' && (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(b, 'enviado')} className="text-[#E1AD01] focus:text-[#E1AD01]"><Send className="h-4 w-4 mr-2" />Enviar</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openDelete(b)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                                </>
                              )}
                              {b.status === 'enviado' && (
                                <>
                                  <DropdownMenuItem onClick={() => setDetailItem(b)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(b, 'aprobado')} className="text-[#708238] focus:text-[#708238]"><Check className="h-4 w-4 mr-2" />Aprobar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(b, 'rechazado')} className="text-[#B91C1C] focus:text-[#B91C1C]"><X className="h-4 w-4 mr-2" />Rechazar</DropdownMenuItem>
                                </>
                              )}
                              {b.status === 'aprobado' && (
                                <DropdownMenuItem onClick={() => setDetailItem(b)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                              )}
                              {b.status === 'rechazado' && (
                                <>
                                  <DropdownMenuItem onClick={() => setDetailItem(b)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openDelete(b)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
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
      <BudgetFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        recipes={recipes}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadBudgets() }}
        onQuickCreated={(_entity, record) => {
          setRecipes((arr) => [...arr, { id: record.id, title: record.name, costPerServing: 0 }])
        }}
      />

      {/* Detail Dialog */}
      <BudgetDetailDialog
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar presupuesto?</DialogTitle>
            <DialogDescription>
              Estás por eliminar el presupuesto de <strong>{deleteItem?.recipeTitle}</strong> ({deleteItem?.servings} porciones)
              con un total de <strong>{deleteItem ? fmtCurrency(deleteItem.totalPrice) : ''}</strong>. Esta acción no se puede deshacer.
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

interface BudgetFormDialogProps {
  open: boolean
  mode: FormMode
  item: CmBudgetRecord | null
  recipes: RecipeOption[]
  onClose: () => void
  onSaved: () => void
  onQuickCreated?: (entity: QuickCreateEntity, record: SelectOption) => void
}

function BudgetFormDialog({ open, mode, item, recipes, onClose, onSaved, onQuickCreated }: BudgetFormDialogProps) {
  const [budgetDate, setBudgetDate] = React.useState<string>(epochToDateInput(Date.now()))
  const [clientName, setClientName] = React.useState('')
  const [validityDays, setValidityDays] = React.useState<string>('15')
  const [budgetNumber, setBudgetNumber] = React.useState('')
  const [observations, setObservations] = React.useState('')
  const [items, setItems] = React.useState<FormBudgetItem[]>([])
  const [discountType, setDiscountType] = React.useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = React.useState<string>('')
  const [taxRate, setTaxRate] = React.useState<string>('')

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setBudgetDate(epochToDateInput(item.budgetDate))
        setClientName(item.clientName || '')
        setValidityDays(item.validityDays != null ? String(item.validityDays) : '15')
        setBudgetNumber(item.budgetNumber || '')
        setObservations(item.observations || '')
        setItems(item.items.map((it) => ({
          key: newItemKey(),
          recipeId: it.recipeId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })))
        setDiscountType(item.discountType || 'percentage')
        setDiscountValue(item.discountValue != null ? String(item.discountValue) : '')
        setTaxRate(item.taxRate != null ? String(item.taxRate) : '')
      } else {
        setBudgetDate(epochToDateInput(Date.now()))
        setClientName('')
        setValidityDays('15')
        setBudgetNumber('')
        setObservations('')
        setItems([{ key: newItemKey(), recipeId: '', quantity: 1, unitPrice: 0 }])
        setDiscountType('percentage')
        setDiscountValue('')
        setTaxRate('')
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
  const subtotal = computedItems.reduce((sum, it) => sum + it.subtotal, 0)

  const dv = Number(discountValue) || 0
  let discountAmount = 0
  if (dv > 0) {
    discountAmount = discountType === 'percentage' ? subtotal * (dv / 100) : Math.min(dv, subtotal)
  }
  const afterDiscount = subtotal - discountAmount

  const tr = Number(taxRate) || 0
  const taxAmount = tr > 0 ? afterDiscount * (tr / 100) : 0
  const totalPrice = afterDiscount + taxAmount
  const profit = totalPrice - totalCost
  const profitPercentage = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

  const addItem = () => {
    setItems((arr) => [...arr, { key: newItemKey(), recipeId: '', quantity: 1, unitPrice: 0 }])
  }
  const removeItem = (key: string) => setItems((arr) => arr.filter((it) => it.key !== key))
  const updateItem = (key: string, patch: Partial<FormBudgetItem>) =>
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const onRecipeSelect = (key: string, recipeId: string) => {
    const r = recipes.find((x) => x.id === recipeId)
    updateItem(key, { recipeId, unitPrice: r ? Math.round(r.costPerServing * 2) : 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validItems = items.filter((it) => it.recipeId && Number(it.quantity) > 0)
    if (validItems.length === 0) return setError('Debe agregar al menos un item con receta y cantidad')
    for (const it of validItems) {
      if (Number(it.unitPrice) < 0) return setError('El precio no puede ser negativo')
    }

    setSaving(true)
    try {
      const body = {
        budgetDate: dateInputToEpoch(budgetDate),
        clientName: clientName.trim() || null,
        validityDays: validityDays ? Number(validityDays) : null,
        budgetNumber: budgetNumber.trim() || null,
        observations: observations.trim() || null,
        items: validItems.map((it) => ({
          recipeId: it.recipeId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
        discountType: dv > 0 ? discountType : null,
        discountValue: dv > 0 ? dv : null,
        taxRate: tr > 0 ? tr : null,
      }
      const url = mode === 'create' ? '/api/cocina-movil/budgets' : `/api/cocina-movil/budgets/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Presupuesto creado' : 'Presupuesto actualizado')
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
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Nuevo Presupuesto' : 'Editar Presupuesto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Cargá un presupuesto con múltiples recetas. El costo y margen se calculan automáticamente.'
              : `Editando presupuesto ${item?.budgetNumber ? `(${item.budgetNumber})` : ''}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-6">
            {error && (
              <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
            )}

            {/* ============ SECCIÓN 1: Datos del Presupuesto ============ */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-semibold text-[#5C3A21]">Datos del Presupuesto</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Fecha del presupuesto</Label>
                  <Input type="date" value={budgetDate} onChange={(e) => setBudgetDate(e.target.value)} className="border-[#5C3A21]/15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Cliente</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Opcional" className="border-[#5C3A21]/15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Validez (días)</Label>
                  <Select value={validityDays} onValueChange={setValidityDays}>
                    <SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VALIDITY_DAYS_OPTIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} días</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">N° de presupuesto</Label>
                  <Input value={budgetNumber} onChange={(e) => setBudgetNumber(e.target.value)} placeholder="Opcional" className="border-[#5C3A21]/15" />
                </div>
              </div>
            </div>

            <Separator />

            {/* ============ SECCIÓN 2: Detalle del Presupuesto ============ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-sm font-semibold text-[#5C3A21]">Detalle del Presupuesto</h3>
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
                  const subtotalItem = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
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
                        <span className="text-sm font-semibold text-[#5C3A21]">{fmtCurrency(subtotalItem)}</span>
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
                <div className="space-y-1.5 sm:col-span-3">
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
                <span className="text-[#5C3A21]">Subtotal:</span>
                <span className="font-semibold text-[#5C3A21]">{fmtCurrency(subtotal)}</span>
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

interface BudgetDetailDialogProps {
  item: CmBudgetRecord | null
  onClose: () => void
}

function BudgetDetailDialog({ item, onClose }: BudgetDetailDialogProps) {
  const [converting, setConverting] = React.useState(false)
  if (!item) return null
  const meta = STATUS_META[item.status]

  const handleConvertToSale = async () => {
    if (!item) return
    setConverting(true)
    try {
      // Create a sale from the budget items
      const body = {
        placeId: '__none__',
        saleDate: Date.now(),
        clientName: item.clientName,
        items: item.items.map((it) => ({
          recipeId: it.recipeId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        discountType: item.discountType,
        discountValue: item.discountValue,
        taxRate: item.taxRate,
        budgetId: item.id,
      }
      const res = await fetch('/api/cocina-movil/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al crear venta')
      // Link the sale back to the budget
      if (data.sale?.id) {
        await fetch(`/api/cocina-movil/budgets/${item.id}/convert-to-sale`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: data.sale.id }),
        }).catch(() => {}) // non-fatal
      }
      toast.success(`Venta creada desde presupuesto`)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al convertir en venta')
    } finally {
      setConverting(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Eye className="h-5 w-5" />Detalle de Presupuesto
          </DialogTitle>
          <DialogDescription>
            Información completa del presupuesto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailField label="Fecha" value={fmtDate(item.budgetDate || item.createdAt)} />
          <DetailField label="Estado">
            <Badge className={`text-[10px] ${meta.bg} text-white`}>{meta.label}</Badge>
          </DetailField>
          <DetailField label="Cliente" value={item.clientName || '—'} />
          <DetailField label="Items" value={String(item.items.length)} />
          <DetailField label="Costo total" value={fmtCurrency(item.totalCost)} />
          <DetailField label="Precio total" value={fmtCurrency(item.totalPrice)} />
          <DetailField label="Ganancia ($)" value={fmtCurrency(item.profit)} />
          <DetailField label="Margen %">
            <span className={`text-sm font-semibold ${marginColor(item.profitPercentage)}`}>
              {fmtPercent(item.profitPercentage)}
            </span>
          </DetailField>
          {item.observations && (
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={item.observations} />
            </div>
          )}
        </div>

        {/* Items table */}
        <div className="rounded-md border border-[#5C3A21]/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Receta</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio/U</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.items.map((it, i) => (
                <TableRow key={it.id} className="border-[#5C3A21]/8">
                  <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                  <TableCell className="text-sm text-[#5C3A21]">{it.recipeName}</TableCell>
                  <TableCell className="text-right text-sm text-[#4A3F36]">{it.quantity}</TableCell>
                  <TableCell className="text-right text-sm text-[#4A3F36]">{fmtCurrency(it.unitPrice)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold text-[#5C3A21]">{fmtCurrency(it.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Convertir en Venta (solo si está aprobado) */}
        {item.status === 'aprobado' && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-[#708238]/30 bg-[#708238]/5">
            <span className="text-sm text-[#5C3A21]">¿Convertir este presupuesto en una Venta?</span>
            <Button type="button" onClick={handleConvertToSale} disabled={converting} className="bg-[#708238] hover:bg-[#708238]/90 text-white">
              {converting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Convertir en Venta
            </Button>
          </div>
        )}

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
// Export (con Suspense)
// ============================================================

export default function CmPresupuestosPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmPresupuestosPageContent />
    </React.Suspense>
  )
}
