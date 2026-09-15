'use client'

/**
 * ============================================================
 * Pedidos de Clientes — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/pedidos-clientes
 * Gestión de pedidos de clientes con workflow de 5 estados:
 *   pendiente → en_preparacion → entregado → vendido | cancelado
 * - Los pedidos "pendiente/en_preparacion/entregado/cancelado" pueden editarse.
 * - Los pedidos "vendido" son finales (no editables ni eliminables).
 * - Un pedido "entregado" puede convertirse en una Venta (genera una
 *   entrada en /cm/admin/ventas y marca el pedido como "vendido").
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ClipboardList, Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2, X, Eye,
  ShoppingBag, Check, ArrowRight,
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

type CmClientOrderStatus = 'pendiente' | 'en_preparacion' | 'entregado' | 'vendido' | 'cancelado'

interface CmClientOrderItem {
  id: string
  clientOrderId: string
  recipeId: string
  recipeName: string
  quantity: number
  unitPrice: number
  costPerUnit: number
  subtotal: number
}

interface CmClientOrderRecord {
  id: string
  orderNumber: string
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
  orderDate: number
  expectedDeliveryDate: number | null
  status: CmClientOrderStatus
  observations: string | null
  items: CmClientOrderItem[]
  total: number
  budgetId: string | null
  budgetNumber: string | null
  saleId: string | null
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

interface FormItem {
  key: string
  recipeId: string
  quantity: number
  unitPrice: number
}

type FormMode = 'create' | 'edit'
type StatusFilter = 'all' | CmClientOrderStatus

// ============================================================
// Constantes
// ============================================================

const STATUS_META: Record<CmClientOrderStatus, { label: string; bg: string }> = {
  pendiente: { label: 'Pendiente', bg: 'bg-[#8A7E70] hover:bg-[#8A7E70]' },
  en_preparacion: { label: 'En Preparación', bg: 'bg-[#E1AD01] hover:bg-[#E1AD01]' },
  entregado: { label: 'Entregado', bg: 'bg-[#2563EB] hover:bg-[#2563EB]' },
  vendido: { label: 'Vendido', bg: 'bg-[#708238] hover:bg-[#708238]' },
  cancelado: { label: 'Cancelado', bg: 'bg-[#B91C1C] hover:bg-[#B91C1C]' },
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_preparacion', label: 'En Preparación' },
  { value: 'entregado', label: 'Entregados' },
  { value: 'vendido', label: 'Vendidos' },
  { value: 'cancelado', label: 'Cancelados' },
]

const STATUS_CHANGE_OPTIONS: { value: CmClientOrderStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_preparacion', label: 'En Preparación' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (value: number): string =>
  `$${Number(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

const fmtDate = (ts: number | null | undefined): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

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

const newItemKey = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `item-${crypto.randomUUID()}`
    : `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// ============================================================
// Página
// ============================================================

function CmPedidosClientesPageContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = React.useState<CmClientOrderRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmClientOrderRecord | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmClientOrderRecord | null>(null)
  const [viewItem, setViewItem] = React.useState<CmClientOrderRecord | null>(null)
  const [convertItem, setConvertItem] = React.useState<CmClientOrderRecord | null>(null)

  const [recipes, setRecipes] = React.useState<RecipeOption[]>([])
  const [places, setPlaces] = React.useState<PlaceOption[]>([])

  // Carga de dropdowns (una sola vez al montar)
  React.useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          fetch('/api/cocina-movil/recipes?pageSize=200&sortBy=title&sortOrder=asc'),
          fetch('/api/cocina-movil/places?isActive=true'),
        ])
        const [rData, pData] = await Promise.all([
          rRes.json().catch(() => ({})),
          pRes.json().catch(() => ({})),
        ])
        setRecipes((rData.recipes || []).map((x: { id: string; title: string; costPerServing: number }) => ({
          id: x.id, title: x.title, costPerServing: x.costPerServing || 0,
        })))
        setPlaces((pData.places || []).map((x: { id: string; name: string }) => ({
          id: x.id, name: x.name,
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
    const stParam = searchParams.get('estado')
    if (stParam === 'pendiente' || stParam === 'en_preparacion' || stParam === 'entregado' || stParam === 'vendido' || stParam === 'cancelado') {
      setStatusFilter(stParam)
    }
  }, [searchParams])

  const loadOrders = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('pageSize', '200')
      params.set('sortBy', 'orderDate')
      params.set('sortOrder', 'desc')
      const res = await fetch(`/api/cocina-movil/client-orders?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  React.useEffect(() => {
    const id = setTimeout(loadOrders, 250)
    return () => clearTimeout(id)
  }, [loadOrders])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }

  const openEdit = (item: CmClientOrderRecord) => {
    if (item.status === 'vendido') {
      toast.error('No se puede editar un pedido ya vendido.')
      return
    }
    setFormMode('edit')
    setEditItem(item)
    setFormOpen(true)
  }

  const openDelete = (item: CmClientOrderRecord) => {
    if (item.status === 'vendido') {
      toast.error('No se puede eliminar un pedido ya vendido.')
      return
    }
    setDeleteItem(item)
  }

  const handleStatusChange = async (item: CmClientOrderRecord, newStatus: CmClientOrderStatus) => {
    try {
      const res = await fetch(`/api/cocina-movil/client-orders/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      const data = await res.json().catch(() => null)
      toast.success(`Pedido marcado como "${STATUS_META[newStatus].label}"`)
      loadOrders()
      // Refresh the detail view if it's open on this item
      if (viewItem?.id === item.id) {
        if (data?.order) setViewItem(data.order)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/client-orders/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      toast.success('Pedido eliminado')
      setDeleteItem(null)
      loadOrders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    window.open(`/api/cocina-movil/client-orders/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />Pedidos de Clientes
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nuevo Pedido
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por n° pedido, cliente, receta…"
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
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron pedidos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>N° Pedido</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o, i) => {
                    const meta = STATUS_META[o.status]
                    return (
                      <TableRow key={o.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                        <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium text-[#5C3A21] whitespace-nowrap">{o.orderNumber}</TableCell>
                        <TableCell className="text-sm text-[#4A3F36] whitespace-nowrap">{fmtDate(o.orderDate)}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-[#5C3A21]">{o.clientName || '—'}</p>
                          {o.expectedDeliveryDate ? (
                            <p className="text-xs text-[#8A7E70]">Entrega: {fmtDate(o.expectedDeliveryDate)}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-[#5C3A21]/10 text-[#5C3A21] hover:bg-[#5C3A21]/15">{o.items.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">{fmtCurrency(o.total)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] ${meta.bg} text-white`}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewItem(o)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                              {o.status !== 'vendido' && (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(o)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Open detail to change status
                                      setViewItem(o)
                                    }}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />Cambiar Estado
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openDelete(o)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
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
      <ClientOrderFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        recipes={recipes}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadOrders() }}
        onQuickCreatedRecipe={(rec) => setRecipes((arr) => [...arr, { id: rec.id, title: rec.name, costPerServing: 0 }])}
      />

      {/* Detail Dialog */}
      <ClientOrderDetailDialog
        item={viewItem}
        onClose={() => setViewItem(null)}
        onStatusChange={(newStatus) => viewItem && handleStatusChange(viewItem, newStatus)}
        onConvert={(item) => { setViewItem(null); setConvertItem(item) }}
      />

      {/* Convert to Sale Dialog */}
      <ConvertToSaleDialog
        item={convertItem}
        places={places}
        onClose={() => setConvertItem(null)}
        onConverted={() => { setConvertItem(null); loadOrders() }}
        onQuickCreatedPlace={(rec) => setPlaces((arr) => [...arr, { id: rec.id, name: rec.name }])}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar pedido?</DialogTitle>
            <DialogDescription>
              Estás por eliminar el pedido <strong>{deleteItem?.orderNumber}</strong> de{' '}
              <strong>{deleteItem?.clientName || 'cliente sin nombre'}</strong> del{' '}
              <strong>{deleteItem ? fmtDate(deleteItem.orderDate) : ''}</strong> por un total de{' '}
              <strong>{deleteItem ? fmtCurrency(deleteItem.total) : ''}</strong>. Esta acción no se puede deshacer.
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
// Form Dialog — Crear / Editar (max-w-3xl)
// ============================================================

interface ClientOrderFormDialogProps {
  open: boolean
  mode: FormMode
  item: CmClientOrderRecord | null
  recipes: RecipeOption[]
  onClose: () => void
  onSaved: () => void
  onQuickCreatedRecipe?: (record: SelectOption) => void
}

function ClientOrderFormDialog({
  open, mode, item, recipes, onClose, onSaved, onQuickCreatedRecipe,
}: ClientOrderFormDialogProps) {
  const [clientName, setClientName] = React.useState('')
  const [clientPhone, setClientPhone] = React.useState('')
  const [clientEmail, setClientEmail] = React.useState('')
  const [orderDate, setOrderDate] = React.useState<string>(epochToDateInput(Date.now()))
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState<string>('')
  const [observations, setObservations] = React.useState('')
  const [items, setItems] = React.useState<FormItem[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Adaptar recetas al formato SelectOption
  const recipeOptions: SelectOption[] = React.useMemo(
    () => recipes.map((r) => ({ id: r.id, name: r.title })),
    [recipes],
  )

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setClientName(item.clientName || '')
        setClientPhone(item.clientPhone || '')
        setClientEmail(item.clientEmail || '')
        setOrderDate(epochToDateInput(item.orderDate))
        setExpectedDeliveryDate(item.expectedDeliveryDate ? epochToDateInput(item.expectedDeliveryDate) : '')
        setObservations(item.observations || '')
        setItems(item.items.map((it) => ({
          key: newItemKey(),
          recipeId: it.recipeId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })))
      } else {
        setClientName('')
        setClientPhone('')
        setClientEmail('')
        setOrderDate(epochToDateInput(Date.now()))
        setExpectedDeliveryDate('')
        setObservations('')
        setItems([{ key: newItemKey(), recipeId: '', quantity: 1, unitPrice: 0 }])
      }
      setError(null)
    }
  }, [open, mode, item])

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)

  const addItem = () => {
    setItems((arr) => [...arr, { key: newItemKey(), recipeId: '', quantity: 1, unitPrice: 0 }])
  }
  const removeItem = (key: string) => setItems((arr) => arr.filter((it) => it.key !== key))
  const updateItem = (key: string, patch: Partial<FormItem>) =>
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))

  const onRecipeSelect = (key: string, recipeId: string) => {
    const rec = recipes.find((r) => r.id === recipeId)
    if (!rec) {
      updateItem(key, { recipeId })
      return
    }
    // Sugerir el costo por porción como precio unitario solo si el item no tiene ya uno
    const it = items.find((x) => x.key === key)
    const hasCustomPrice = !!it && Number(it.unitPrice) > 0
    updateItem(key, {
      recipeId,
      unitPrice: hasCustomPrice ? it!.unitPrice : Math.round(rec.costPerServing || 0),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validItems = items.filter((it) => it.recipeId && Number(it.quantity) > 0)
    if (validItems.length === 0) return setError('Debe agregar al menos un item con receta y cantidad')
    for (const it of validItems) {
      if (Number(it.unitPrice) < 0) return setError('El precio no puede ser negativo')
    }
    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      return setError('El email no es válido')
    }

    setSaving(true)
    try {
      const body = {
        clientName: clientName.trim() || null,
        clientPhone: clientPhone.trim() || null,
        clientEmail: clientEmail.trim() || null,
        orderDate: dateInputToEpoch(orderDate),
        expectedDeliveryDate: expectedDeliveryDate ? dateInputToEpoch(expectedDeliveryDate) : null,
        observations: observations.trim() || null,
        items: validItems.map((it) => ({
          recipeId: it.recipeId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      }
      const url = mode === 'create' ? '/api/cocina-movil/client-orders' : `/api/cocina-movil/client-orders/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Pedido creado' : 'Pedido actualizado')
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
            <ClipboardList className="h-5 w-5" />
            {mode === 'create' ? 'Nuevo Pedido de Cliente' : 'Editar Pedido de Cliente'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Cargá un pedido con su detalle de recetas. El total se calcula automáticamente.'
              : `Editando pedido ${item?.orderNumber || ''}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-6">
            {error && (
              <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
            )}

            {/* ============ Sección 1: Datos del cliente ============ */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-semibold text-[#5C3A21]">Datos del Cliente y Pedido</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Cliente</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre del cliente…"
                    className="border-[#5C3A21]/15"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Teléfono</Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ej: 3794112233…"
                    className="border-[#5C3A21]/15"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Email</Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@email.com…"
                    className="border-[#5C3A21]/15"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Fecha de pedido *</Label>
                  <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="border-[#5C3A21]/15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Fecha estimada de entrega</Label>
                  <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className="border-[#5C3A21]/15" />
                </div>
              </div>
            </div>

            <Separator />

            {/* ============ Sección 2: Detalle del Pedido ============ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-sm font-semibold text-[#5C3A21]">Detalle del Pedido</h3>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="border-[#5C3A21]/20 text-[#5C3A21]">
                  <Plus className="h-3.5 w-3.5" />Agregar Item
                </Button>
              </div>
              <div className="space-y-2 pl-10">
                {items.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[#5C3A21]/20 rounded-md">
                    <p className="text-sm text-[#8A7E70]">No hay items. Hacé clic en &quot;Agregar Item&quot;.</p>
                  </div>
                ) : (
                  items.map((it) => {
                    const subtotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                    return (
                      <div key={it.key} className="p-3 rounded-md border border-[#5C3A21]/15 bg-[#FFF8E7]/30 space-y-2">
                        {/* Row 1: Receta + Remove */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-11">
                            <Label className="text-[10px] text-[#8A7E70]">Receta</Label>
                            <SelectWithCreate
                              entity="recipe"
                              value={it.recipeId}
                              onValueChange={(v) => onRecipeSelect(it.key, v)}
                              options={recipeOptions}
                              placeholder="Seleccionar receta…"
                              compact
                              triggerClassName="h-9 border-[#5C3A21]/15 text-xs"
                              onCreated={(r) => { onQuickCreatedRecipe?.(r) }}
                            />
                          </div>
                          <div className="sm:col-span-1 flex items-end justify-center">
                            <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(it.key)} className="h-8 w-8 text-[#B91C1C] hover:bg-[#B91C1C]/10">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Row 2: Cantidad + Precio/U + Subtotal */}
                        <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-4">
                            <Label className="text-[10px] text-[#8A7E70]">Cantidad</Label>
                            <Input type="number" min="0" step="any" value={it.quantity} onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) })} className="h-9 border-[#5C3A21]/15 text-xs" />
                          </div>
                          <div className="sm:col-span-4">
                            <Label className="text-[10px] text-[#8A7E70]">Precio/U ($)</Label>
                            <Input type="number" min="0" step="any" value={it.unitPrice} onChange={(e) => updateItem(it.key, { unitPrice: Number(e.target.value) })} className="h-9 border-[#5C3A21]/15 text-xs" />
                          </div>
                          <div className="sm:col-span-4">
                            <Label className="text-[10px] text-[#8A7E70]">Subtotal</Label>
                            <div className="h-9 flex items-center justify-end px-3 bg-[#E1AD01]/10 border border-[#E1AD01]/30 rounded-md">
                              <span className="text-sm font-semibold text-[#5C3A21]">{fmtCurrency(subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <Separator />

            {/* ============ Sección 3: Observaciones ============ */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="text-sm font-semibold text-[#5C3A21]">Observaciones</h3>
              </div>
              <div className="pl-10">
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Notas internas, condiciones especiales, instrucciones de entrega…"
                  rows={2}
                  className="border-[#5C3A21]/15 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 bg-white border-t border-[#5C3A21]/10 px-6 py-3 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-[#8A7E70]">Total:</span>
              <span className="text-xl font-bold text-[#5C3A21]">{fmtCurrency(total)}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Detail Dialog — Ver Detalle (max-w-3xl)
// ============================================================

interface ClientOrderDetailDialogProps {
  item: CmClientOrderRecord | null
  onClose: () => void
  onStatusChange: (newStatus: CmClientOrderStatus) => void
  onConvert: (item: CmClientOrderRecord) => void
}

function ClientOrderDetailDialog({
  item, onClose, onStatusChange, onConvert,
}: ClientOrderDetailDialogProps) {
  if (!item) return null
  const meta = STATUS_META[item.status]
  const canConvert = item.status === 'entregado' && !item.saleId
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Eye className="h-5 w-5" />Detalle de Pedido
          </DialogTitle>
          <DialogDescription>
            {item.orderNumber} — Pedido de {item.clientName || 'cliente sin nombre'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Datos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-md bg-[#FFF8E7]/50 border border-[#5C3A21]/10">
            <div>
              <p className="text-xs text-[#8A7E70]">N° Pedido</p>
              <p className="text-sm font-medium text-[#5C3A21]">{item.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Estado</p>
              <Badge className={`text-[10px] ${meta.bg} text-white`}>{meta.label}</Badge>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Cliente</p>
              <p className="text-sm font-medium text-[#5C3A21]">{item.clientName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Teléfono</p>
              <p className="text-sm text-[#4A3F36]">{item.clientPhone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Email</p>
              <p className="text-sm text-[#4A3F36] truncate">{item.clientEmail || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Fecha de pedido</p>
              <p className="text-sm text-[#4A3F36]">{fmtDate(item.orderDate)}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Entrega estimada</p>
              <p className="text-sm text-[#4A3F36]">{fmtDate(item.expectedDeliveryDate)}</p>
            </div>
            {item.budgetNumber && (
              <div>
                <p className="text-xs text-[#8A7E70]">Presupuesto origen</p>
                <p className="text-sm text-[#4A3F36]">{item.budgetNumber}</p>
              </div>
            )}
            {item.observations && (
              <div className="sm:col-span-2">
                <p className="text-xs text-[#8A7E70]">Observaciones</p>
                <p className="text-sm text-[#4A3F36] whitespace-pre-wrap">{item.observations}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border border-[#5C3A21]/10 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Receta</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Precio/U</TableHead>
                    <TableHead className="text-right">Costo/U</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.items.map((it, i) => (
                    <TableRow key={it.id} className="border-[#5C3A21]/8">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell className="text-sm font-medium text-[#5C3A21]">{it.recipeName}</TableCell>
                      <TableCell className="text-right text-sm text-[#4A3F36]">{it.quantity}</TableCell>
                      <TableCell className="text-right text-sm text-[#4A3F36]">{fmtCurrency(it.unitPrice)}</TableCell>
                      <TableCell className="text-right text-xs text-[#8A7E70]">{fmtCurrency(it.costPerUnit)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-[#5C3A21]">{fmtCurrency(it.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end items-baseline gap-2 pt-2">
            <span className="text-sm text-[#8A7E70]">Total:</span>
            <span className="text-2xl font-bold text-[#5C3A21]">{fmtCurrency(item.total)}</span>
          </div>

          {/* Status change */}
          {item.status !== 'vendido' && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-[#FBF1DC]/40 border border-[#5C3A21]/10 flex-wrap">
              <span className="text-xs text-[#8A7E70]">Cambiar estado:</span>
              <div className="flex flex-wrap gap-2">
                {STATUS_CHANGE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={item.status === opt.value ? 'default' : 'outline'}
                    disabled={item.status === opt.value}
                    onClick={() => onStatusChange(opt.value)}
                    className={
                      item.status === opt.value
                        ? `h-7 text-xs text-white ${STATUS_META[opt.value].bg}`
                        : 'h-7 text-xs border-[#5C3A21]/20 text-[#5C3A21]'
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Convert to Sale */}
          {canConvert && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-md bg-[#E1AD01]/10 border border-[#E1AD01]/30">
              <ShoppingBag className="h-5 w-5 text-[#7a5c00] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#5C3A21]">¿Pedido entregado?</p>
                <p className="text-xs text-[#8A7E70]">Convertilo en una Venta para registrarla en el módulo de Ventas.</p>
              </div>
              <Button onClick={() => onConvert(item)} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
                <Check className="h-4 w-4" />Convertir en Venta
              </Button>
            </div>
          )}
          {item.saleId && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-md bg-[#708238]/10 border border-[#708238]/30">
              <Check className="h-5 w-5 text-[#708238] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#5C3A21]">Pedido ya vendido</p>
                <p className="text-xs text-[#8A7E70]">Venta asociada: <code className="text-[10px] bg-[#5C3A21]/8 px-1 rounded">{item.saleId}</code></p>
              </div>
              <Button asChild className="bg-[#708238] hover:bg-[#708238]/90 text-white">
                <Link href="/cm/admin/ventas">Ver Venta<ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Convert to Sale Dialog
// ============================================================

interface ConvertToSaleDialogProps {
  item: CmClientOrderRecord | null
  places: PlaceOption[]
  onClose: () => void
  onConverted: () => void
  onQuickCreatedPlace?: (record: SelectOption) => void
}

function ConvertToSaleDialog({
  item, places, onClose, onConverted, onQuickCreatedPlace,
}: ConvertToSaleDialogProps) {
  const [placeId, setPlaceId] = React.useState<string>('')
  const [saleDate, setSaleDate] = React.useState<string>(epochToDateInput(Date.now()))
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (item) {
      setPlaceId('')
      setSaleDate(epochToDateInput(Date.now()))
      setError(null)
    }
  }, [item])

  if (!item) return null

  const placeOptions: SelectOption[] = places

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!item) return
    if (!placeId) {
      setError('Debe seleccionar un lugar para registrar la venta.')
      return
    }
    setSaving(true)
    try {
      // 1. Crear la venta con los items del pedido
      const saleBody = {
        placeId,
        clientName: item.clientName || null,
        saleDate: dateInputToEpoch(saleDate),
        observations: `Generada desde pedido ${item.orderNumber}` + (item.observations ? ` — ${item.observations}` : ''),
        items: item.items.map((it) => ({
          recipeId: it.recipeId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      }
      const createRes = await fetch('/api/cocina-movil/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleBody),
      })
      const createData = await createRes.json().catch(() => ({}))
      if (!createRes.ok) throw new Error(createData.error || 'Error al crear la venta')
      const saleId = createData.sale?.id
      if (!saleId) throw new Error('No se recibió el ID de la venta creada')

      // 2. Marcar el pedido como vendido y asociarlo
      const convertRes = await fetch(`/api/cocina-movil/client-orders/${item.id}/convert-to-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId }),
      })
      const convertData = await convertRes.json().catch(() => ({}))
      if (!convertRes.ok) throw new Error(convertData.error || 'Error al asociar el pedido con la venta')

      toast.success('Pedido convertido en venta correctamente')
      onConverted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir en venta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Check className="h-5 w-5" />Convertir en Venta
          </DialogTitle>
          <DialogDescription>
            Pedido {item.orderNumber} — {item.clientName || 'cliente sin nombre'}. Se creará una venta con los items del pedido.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
            {error && (
              <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
            )}

            {/* Items (read-only) */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />Items del Pedido
              </h3>
              <div className="border border-[#5C3A21]/10 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
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
                          <TableCell className="text-sm font-medium text-[#5C3A21]">{it.recipeName}</TableCell>
                          <TableCell className="text-right text-sm text-[#4A3F36]">{it.quantity}</TableCell>
                          <TableCell className="text-right text-sm text-[#4A3F36]">{fmtCurrency(it.unitPrice)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-[#5C3A21]">{fmtCurrency(it.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex justify-end items-baseline gap-2 pt-1">
                <span className="text-xs text-[#8A7E70]">Total del pedido:</span>
                <span className="text-base font-bold text-[#5C3A21]">{fmtCurrency(item.total)}</span>
              </div>
            </div>

            <Separator />

            {/* Datos de la venta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Lugar *</Label>
                <SelectWithCreate
                  entity="place"
                  value={placeId || '__none__'}
                  onValueChange={(v) => setPlaceId(v === '__none__' ? '' : v)}
                  options={placeOptions}
                  placeholder="Sin lugar asignado"
                  allowNone
                  noneLabel="— Sin lugar —"
                  onCreated={(r) => onQuickCreatedPlace?.(r)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Fecha de venta *</Label>
                <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="border-[#5C3A21]/15" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 bg-white border-t border-[#5C3A21]/10 px-6 py-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Check className="h-4 w-4 mr-1" />
              Convertir en Venta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Export (con Suspense)
// ============================================================

export default function CmPedidosClientesPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmPedidosClientesPageContent />
    </React.Suspense>
  )
}
