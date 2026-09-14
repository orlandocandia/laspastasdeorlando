'use client'

/**
 * ============================================================
 * Pedidos a Proveedores — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/pedidos-proveedores
 * Gestión de pedidos a proveedores con workflow de 5 estados:
 *   pendiente → enviado → recibido → comprado | cancelado
 * - Los pedidos "pendiente/enviado/recibido/cancelado" pueden editarse.
 * - Los pedidos "comprado" son finales (no editables ni eliminables).
 * - Un pedido "recibido" puede convertirse en una Compra (genera una
 *   entrada en /cm/admin/compras y marca el pedido como "comprado").
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ClipboardList, Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2, X, Eye,
  Package, FlaskConical, Check, ArrowRight,
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

type CmPurchaseOrderStatus = 'pendiente' | 'enviado' | 'recibido' | 'comprado' | 'cancelado'

interface CmPurchaseOrderItem {
  id: string
  purchaseOrderId: string
  itemType: 'ingredient' | 'supply'
  itemId: string
  itemName: string
  quantity: number
  unit: string
  pricePerUnit: number
  subtotal: number
}

interface CmPurchaseOrderRecord {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  orderDate: number
  expectedDeliveryDate: number | null
  status: CmPurchaseOrderStatus
  observations: string | null
  items: CmPurchaseOrderItem[]
  total: number
  purchaseId: string | null
  createdAt: number
  updatedAt: number
}

interface OptionItem {
  id: string
  name: string
  purchaseUnit: string
  purchasePrice: number
}

interface FormItem {
  key: string
  itemType: 'ingredient' | 'supply'
  itemId: string
  quantity: number
  unit: string
  pricePerUnit: number
}

type FormMode = 'create' | 'edit'
type StatusFilter = 'all' | CmPurchaseOrderStatus

// ============================================================
// Constantes
// ============================================================

const STATUS_META: Record<CmPurchaseOrderStatus, { label: string; bg: string }> = {
  pendiente: { label: 'Pendiente', bg: 'bg-[#8A7E70] hover:bg-[#8A7E70]' },
  enviado: { label: 'Enviado', bg: 'bg-[#E1AD01] hover:bg-[#E1AD01]' },
  recibido: { label: 'Recibido', bg: 'bg-[#2563EB] hover:bg-[#2563EB]' },
  comprado: { label: 'Comprado', bg: 'bg-[#708238] hover:bg-[#708238]' },
  cancelado: { label: 'Cancelado', bg: 'bg-[#B91C1C] hover:bg-[#B91C1C]' },
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'recibido', label: 'Recibidos' },
  { value: 'comprado', label: 'Comprados' },
  { value: 'cancelado', label: 'Cancelados' },
]

const STATUS_CHANGE_OPTIONS: { value: CmPurchaseOrderStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'recibido', label: 'Recibido' },
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

function CmPedidosProveedoresPageContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = React.useState<CmPurchaseOrderRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [supplierFilter, setSupplierFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmPurchaseOrderRecord | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmPurchaseOrderRecord | null>(null)
  const [viewItem, setViewItem] = React.useState<CmPurchaseOrderRecord | null>(null)
  const [convertItem, setConvertItem] = React.useState<CmPurchaseOrderRecord | null>(null)

  const [suppliers, setSuppliers] = React.useState<OptionItem[]>([])
  const [places, setPlaces] = React.useState<OptionItem[]>([])
  const [ingredients, setIngredients] = React.useState<OptionItem[]>([])
  const [supplies, setSupplies] = React.useState<OptionItem[]>([])

  // Carga de dropdowns (una sola vez al montar)
  React.useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [sRes, pRes, iRes, supRes] = await Promise.all([
          fetch('/api/cocina-movil/suppliers?isActive=true'),
          fetch('/api/cocina-movil/places?isActive=true'),
          fetch('/api/cocina-movil/ingredients?isActive=true'),
          fetch('/api/cocina-movil/supplies?isActive=true'),
        ])
        const [sData, pData, iData, supData] = await Promise.all([
          sRes.json().catch(() => ({})),
          pRes.json().catch(() => ({})),
          iRes.json().catch(() => ({})),
          supRes.json().catch(() => ({})),
        ])
        setSuppliers((sData.suppliers || []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name, purchaseUnit: '', purchasePrice: 0 })))
        setPlaces((pData.places || []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name, purchaseUnit: '', purchasePrice: 0 })))
        setIngredients((iData.ingredients || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({
          id: x.id, name: x.name, purchaseUnit: x.purchaseUnit || '', purchasePrice: x.purchasePrice || 0,
        })))
        setSupplies((supData.supplies || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({
          id: x.id, name: x.name, purchaseUnit: x.purchaseUnit || '', purchasePrice: x.purchasePrice || 0,
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

  const loadOrders = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (supplierFilter !== 'all') params.set('supplierId', supplierFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('pageSize', '200')
      params.set('sortBy', 'orderDate')
      params.set('sortOrder', 'desc')
      const res = await fetch(`/api/cocina-movil/purchase-orders?${params.toString()}`)
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
  }, [search, supplierFilter, statusFilter])

  React.useEffect(() => {
    const id = setTimeout(loadOrders, 250)
    return () => clearTimeout(id)
  }, [loadOrders])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }

  const openEdit = (item: CmPurchaseOrderRecord) => {
    if (item.status === 'comprado') {
      toast.error('No se puede editar un pedido ya comprado.')
      return
    }
    setFormMode('edit')
    setEditItem(item)
    setFormOpen(true)
  }

  const openDelete = (item: CmPurchaseOrderRecord) => {
    if (item.status === 'comprado') {
      toast.error('No se puede eliminar un pedido ya comprado.')
      return
    }
    setDeleteItem(item)
  }

  const handleStatusChange = async (item: CmPurchaseOrderRecord, newStatus: CmPurchaseOrderStatus) => {
    try {
      const res = await fetch(`/api/cocina-movil/purchase-orders/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'HTTP ' + res.status)
      }
      toast.success(`Pedido marcado como "${STATUS_META[newStatus].label}"`)
      loadOrders()
      // Refresh the detail view if it's open on this item
      if (viewItem?.id === item.id) {
        const updated = await res.json().catch(() => null)
        if (updated?.order) setViewItem(updated.order)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/purchase-orders/${deleteItem.id}`, { method: 'DELETE' })
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
    if (supplierFilter !== 'all') params.set('supplierId', supplierFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    window.open(`/api/cocina-movil/purchase-orders/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />Pedidos a Proveedores
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por n° pedido, proveedor, item…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Proveedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                    <TableHead>Proveedor</TableHead>
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
                          <p className="text-sm font-medium text-[#5C3A21]">{o.supplierName}</p>
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
                              {o.status !== 'comprado' && (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(o)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Reuse status menu via a prompt-like dropdown submenu would be nice,
                                      // but the spec asks for "Cambiar Estado" — open detail to change.
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
      <PurchaseOrderFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        suppliers={suppliers}
        ingredients={ingredients}
        supplies={supplies}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadOrders() }}
        onQuickCreated={(entity, record) => {
          if (entity === 'supplier') setSuppliers((arr) => [...arr, { id: record.id, name: record.name, purchaseUnit: '', purchasePrice: 0 }])
          else if (entity === 'ingredient') setIngredients((arr) => [...arr, { id: record.id, name: record.name, purchaseUnit: '', purchasePrice: 0 }])
          else if (entity === 'supply') setSupplies((arr) => [...arr, { id: record.id, name: record.name, purchaseUnit: '', purchasePrice: 0 }])
        }}
      />

      {/* Detail Dialog */}
      <PurchaseOrderDetailDialog
        item={viewItem}
        places={places}
        onClose={() => setViewItem(null)}
        onStatusChange={(newStatus) => viewItem && handleStatusChange(viewItem, newStatus)}
        onConvert={(item) => { setViewItem(null); setConvertItem(item) }}
        onQuickCreatedPlace={(rec) => setPlaces((arr) => [...arr, { id: rec.id, name: rec.name, purchaseUnit: '', purchasePrice: 0 }])}
      />

      {/* Convert to Purchase Dialog */}
      <ConvertToPurchaseDialog
        item={convertItem}
        places={places}
        onClose={() => setConvertItem(null)}
        onConverted={() => { setConvertItem(null); loadOrders() }}
        onQuickCreatedPlace={(rec) => setPlaces((arr) => [...arr, { id: rec.id, name: rec.name, purchaseUnit: '', purchasePrice: 0 }])}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar pedido?</DialogTitle>
            <DialogDescription>
              Estás por eliminar el pedido <strong>{deleteItem?.orderNumber}</strong> a{' '}
              <strong>{deleteItem?.supplierName}</strong> del{' '}
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

interface PurchaseOrderFormDialogProps {
  open: boolean
  mode: FormMode
  item: CmPurchaseOrderRecord | null
  suppliers: OptionItem[]
  ingredients: OptionItem[]
  supplies: OptionItem[]
  onClose: () => void
  onSaved: () => void
  onQuickCreated?: (entity: QuickCreateEntity, record: SelectOption) => void
}

function PurchaseOrderFormDialog({
  open, mode, item, suppliers, ingredients, supplies, onClose, onSaved, onQuickCreated,
}: PurchaseOrderFormDialogProps) {
  const [supplierId, setSupplierId] = React.useState('')
  const [orderDate, setOrderDate] = React.useState<string>(epochToDateInput(Date.now()))
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState<string>('')
  const [observations, setObservations] = React.useState('')
  const [items, setItems] = React.useState<FormItem[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setSupplierId(item.supplierId)
        setOrderDate(epochToDateInput(item.orderDate))
        setExpectedDeliveryDate(item.expectedDeliveryDate ? epochToDateInput(item.expectedDeliveryDate) : '')
        setObservations(item.observations || '')
        setItems(item.items.map((it) => ({
          key: newItemKey(),
          itemType: it.itemType,
          itemId: it.itemId,
          quantity: it.quantity,
          unit: it.unit,
          pricePerUnit: it.pricePerUnit,
        })))
      } else {
        setSupplierId('')
        setOrderDate(epochToDateInput(Date.now()))
        setExpectedDeliveryDate('')
        setObservations('')
        setItems([{ key: newItemKey(), itemType: 'ingredient', itemId: '', quantity: 1, unit: 'kg', pricePerUnit: 0 }])
      }
      setError(null)
    }
  }, [open, mode, item])

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0)

  const addItem = () => {
    setItems((arr) => [...arr, { key: newItemKey(), itemType: 'ingredient', itemId: '', quantity: 1, unit: 'kg', pricePerUnit: 0 }])
  }
  const removeItem = (key: string) => setItems((arr) => arr.filter((it) => it.key !== key))
  const updateItem = (key: string, patch: Partial<FormItem>) =>
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))

  const onItemTypeChange = (key: string, newType: 'ingredient' | 'supply') => {
    updateItem(key, { itemType: newType, itemId: '', unit: newType === 'ingredient' ? 'kg' : 'u' })
  }

  const onProductSelect = (key: string, productId: string) => {
    const it = items.find((x) => x.key === key)
    if (!it) return
    const pool = it.itemType === 'ingredient' ? ingredients : supplies
    const prod = pool.find((p) => p.id === productId)
    if (!prod) {
      updateItem(key, { itemId: productId })
      return
    }
    updateItem(key, {
      itemId: productId,
      unit: prod.purchaseUnit || it.unit,
      pricePerUnit: prod.purchasePrice || it.pricePerUnit,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!supplierId) return setError('El proveedor es obligatorio')
    const validItems = items.filter((it) => it.itemId && Number(it.quantity) > 0)
    if (validItems.length === 0) return setError('Debe agregar al menos un item con producto y cantidad')
    for (const it of validItems) {
      if (!it.unit?.trim()) return setError('Todos los items deben tener una unidad')
      if (Number(it.pricePerUnit) < 0) return setError('El precio no puede ser negativo')
    }

    setSaving(true)
    try {
      const body = {
        supplierId,
        orderDate: dateInputToEpoch(orderDate),
        expectedDeliveryDate: expectedDeliveryDate ? dateInputToEpoch(expectedDeliveryDate) : null,
        observations: observations.trim() || null,
        items: validItems.map((it) => ({
          itemType: it.itemType,
          itemId: it.itemId,
          quantity: Number(it.quantity),
          unit: it.unit.trim(),
          pricePerUnit: Number(it.pricePerUnit),
        })),
      }
      const url = mode === 'create' ? '/api/cocina-movil/purchase-orders' : `/api/cocina-movil/purchase-orders/${item!.id}`
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
            {mode === 'create' ? 'Nuevo Pedido a Proveedor' : 'Editar Pedido a Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Cargá un pedido con su detalle de items. El total se calcula automáticamente.'
              : `Editando pedido ${item?.orderNumber || ''}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-6">
            {error && (
              <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
            )}

            {/* ============ Sección 1: Datos generales ============ */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-semibold text-[#5C3A21]">Datos del Pedido</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Proveedor *</Label>
                  <SelectWithCreate
                    entity="supplier"
                    value={supplierId}
                    onValueChange={setSupplierId}
                    options={suppliers}
                    placeholder="Seleccionar proveedor…"
                    onCreated={(r) => onQuickCreated?.('supplier', r)}
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
                {/* Header (desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-[#8A7E70]">
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-2 text-right">Cantidad</div>
                  <div className="col-span-1 text-right">Unidad</div>
                  <div className="col-span-2 text-right">Precio/U</div>
                  <div className="col-span-1 text-right">Subtotal</div>
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[#5C3A21]/20 rounded-md">
                    <p className="text-sm text-[#8A7E70]">No hay items. Hacé clic en &quot;Agregar Item&quot;.</p>
                  </div>
                ) : (
                  items.map((it) => {
                    const pool = it.itemType === 'ingredient' ? ingredients : supplies
                    const subtotal = (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0)
                    return (
                      <div key={it.key} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
                        {/* Tipo */}
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] text-[#8A7E70] sm:hidden">Tipo</Label>
                          <Select value={it.itemType} onValueChange={(v) => onItemTypeChange(it.key, v as 'ingredient' | 'supply')}>
                            <SelectTrigger className="h-9 border-[#5C3A21]/15 text-xs">
                              <span className="flex items-center gap-1.5">
                                {it.itemType === 'ingredient' ? <Package className="h-3.5 w-3.5 text-[#708238]" /> : <FlaskConical className="h-3.5 w-3.5 text-[#E1AD01]" />}
                                <SelectValue />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ingredient">Materia Prima</SelectItem>
                              <SelectItem value="supply">Insumo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Producto */}
                        <div className="sm:col-span-4">
                          <Label className="text-[10px] text-[#8A7E70] sm:hidden">Producto</Label>
                          <SelectWithCreate
                            entity={it.itemType}
                            value={it.itemId}
                            onValueChange={(v) => onProductSelect(it.key, v)}
                            options={pool}
                            placeholder={it.itemType === 'ingredient' ? 'Seleccionar materia prima…' : 'Seleccionar insumo…'}
                            compact
                            triggerClassName="h-9 border-[#5C3A21]/15 text-xs"
                            onCreated={(r) => { onQuickCreated?.(it.itemType, r) }}
                          />
                        </div>
                        {/* Cantidad */}
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] text-[#8A7E70] sm:hidden">Cantidad</Label>
                          <Input
                            type="number" min="0" step="any"
                            value={it.quantity}
                            onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) })}
                            className="h-9 border-[#5C3A21]/15 text-xs text-right"
                          />
                        </div>
                        {/* Unidad */}
                        <div className="sm:col-span-1">
                          <Label className="text-[10px] text-[#8A7E70] sm:hidden">Unidad</Label>
                          <Input
                            value={it.unit}
                            onChange={(e) => updateItem(it.key, { unit: e.target.value })}
                            placeholder="kg"
                            className="h-9 border-[#5C3A21]/15 text-xs"
                          />
                        </div>
                        {/* Precio/U */}
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] text-[#8A7E70] sm:hidden">Precio/U</Label>
                          <Input
                            type="number" min="0" step="any"
                            value={it.pricePerUnit}
                            onChange={(e) => updateItem(it.key, { pricePerUnit: Number(e.target.value) })}
                            placeholder="0"
                            className="h-9 border-[#5C3A21]/15 text-xs text-right"
                          />
                        </div>
                        {/* Subtotal + Remove */}
                        <div className="sm:col-span-1 flex items-center justify-end gap-1">
                          <span className="text-xs font-semibold text-[#5C3A21] hidden sm:inline">{fmtCurrency(subtotal)}</span>
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(it.key)} className="h-8 w-8 text-[#B91C1C] hover:bg-[#B91C1C]/10">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Subtotal (mobile) */}
                        <div className="sm:hidden col-span-1 flex items-center justify-between text-xs">
                          <span className="text-[#8A7E70]">Subtotal:</span>
                          <span className="font-semibold text-[#5C3A21]">{fmtCurrency(subtotal)}</span>
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

interface PurchaseOrderDetailDialogProps {
  item: CmPurchaseOrderRecord | null
  places: OptionItem[]
  onClose: () => void
  onStatusChange: (newStatus: CmPurchaseOrderStatus) => void
  onConvert: (item: CmPurchaseOrderRecord) => void
  onQuickCreatedPlace?: (record: SelectOption) => void
}

function PurchaseOrderDetailDialog({
  item, onClose, onStatusChange, onConvert,
}: PurchaseOrderDetailDialogProps) {
  if (!item) return null
  const meta = STATUS_META[item.status]
  const canConvert = item.status === 'recibido' && !item.purchaseId
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Eye className="h-5 w-5" />Detalle de Pedido
          </DialogTitle>
          <DialogDescription>
            {item.orderNumber} — Pedido a {item.supplierName}
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
              <p className="text-xs text-[#8A7E70]">Proveedor</p>
              <p className="text-sm font-medium text-[#5C3A21]">{item.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Fecha de pedido</p>
              <p className="text-sm text-[#4A3F36]">{fmtDate(item.orderDate)}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7E70]">Entrega estimada</p>
              <p className="text-sm text-[#4A3F36]">{fmtDate(item.expectedDeliveryDate)}</p>
            </div>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Precio/U</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.items.map((it, i) => (
                    <TableRow key={it.id} className="border-[#5C3A21]/8">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${it.itemType === 'ingredient' ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#E1AD01] hover:bg-[#E1AD01]'}`}>
                          <span className="flex items-center gap-1">
                            {it.itemType === 'ingredient' ? <Package className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
                            {it.itemType === 'ingredient' ? 'Materia Prima' : 'Insumo'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#5C3A21]">{it.itemName}</TableCell>
                      <TableCell className="text-right text-sm text-[#4A3F36]">{it.quantity}</TableCell>
                      <TableCell className="text-sm text-[#4A3F36]">{it.unit}</TableCell>
                      <TableCell className="text-right text-sm text-[#4A3F36]">{fmtCurrency(it.pricePerUnit)}</TableCell>
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
          {item.status !== 'comprado' && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-[#FBF1DC]/40 border border-[#5C3A21]/10">
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

          {/* Convert / Ver Compra */}
          {canConvert && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-md bg-[#E1AD01]/10 border border-[#E1AD01]/30">
              <ClipboardList className="h-5 w-5 text-[#7a5c00] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#5C3A21]">¿Recibiste este pedido?</p>
                <p className="text-xs text-[#8A7E70]">Convertilo en una Compra para registrarla en el módulo de Compras.</p>
              </div>
              <Button onClick={() => onConvert(item)} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
                <Check className="h-4 w-4" />Convertir en Compra
              </Button>
            </div>
          )}
          {item.purchaseId && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-md bg-[#708238]/10 border border-[#708238]/30">
              <Check className="h-5 w-5 text-[#708238] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#5C3A21]">Pedido ya comprado</p>
                <p className="text-xs text-[#8A7E70]">Compra asociada: <code className="text-[10px] bg-[#5C3A21]/8 px-1 rounded">{item.purchaseId}</code></p>
              </div>
              <Button asChild className="bg-[#708238] hover:bg-[#708238]/90 text-white">
                <Link href="/cm/admin/compras">Ver Compra<ArrowRight className="h-4 w-4" /></Link>
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
// Convert to Purchase Dialog
// ============================================================

interface ConvertToPurchaseDialogProps {
  item: CmPurchaseOrderRecord | null
  places: OptionItem[]
  onClose: () => void
  onConverted: () => void
  onQuickCreatedPlace?: (record: SelectOption) => void
}

function ConvertToPurchaseDialog({
  item, places, onClose, onConverted, onQuickCreatedPlace,
}: ConvertToPurchaseDialogProps) {
  const [placeId, setPlaceId] = React.useState<string>('')
  const [purchaseDate, setPurchaseDate] = React.useState<string>(epochToDateInput(Date.now()))
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (item) {
      setPlaceId('')
      setPurchaseDate(epochToDateInput(Date.now()))
      setError(null)
    }
  }, [item])

  if (!item) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!item) return
    setSaving(true)
    try {
      // 1. Crear la compra con los items del pedido
      const purchaseBody = {
        supplierId: item.supplierId,
        placeId: placeId || null,
        purchaseDate: dateInputToEpoch(purchaseDate),
        invoiceNumber: item.orderNumber || null,
        observations: `Generada desde pedido ${item.orderNumber}` + (item.observations ? ` — ${item.observations}` : ''),
        items: item.items.map((it) => ({
          itemType: it.itemType,
          itemId: it.itemId,
          quantity: it.quantity,
          unit: it.unit,
          pricePerUnit: it.pricePerUnit,
        })),
      }
      const createRes = await fetch('/api/cocina-movil/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseBody),
      })
      const createData = await createRes.json().catch(() => ({}))
      if (!createRes.ok) throw new Error(createData.error || 'Error al crear la compra')
      const purchaseId = createData.purchase?.id
      if (!purchaseId) throw new Error('No se recibió el ID de la compra creada')

      // 2. Marcar el pedido como comprado y asociarlo
      const convertRes = await fetch(`/api/cocina-movil/purchase-orders/${item.id}/convert-to-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId }),
      })
      const convertData = await convertRes.json().catch(() => ({}))
      if (!convertRes.ok) throw new Error(convertData.error || 'Error al asociar el pedido con la compra')

      toast.success('Pedido convertido en compra correctamente')
      onConverted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir en compra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Check className="h-5 w-5" />Convertir en Compra
          </DialogTitle>
          <DialogDescription>
            Pedido {item.orderNumber} — {item.supplierName}. Se creará una compra con los items del pedido.
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Precio/U</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {item.items.map((it, i) => (
                        <TableRow key={it.id} className="border-[#5C3A21]/8">
                          <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${it.itemType === 'ingredient' ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#E1AD01] hover:bg-[#E1AD01]'}`}>
                              <span className="flex items-center gap-1">
                                {it.itemType === 'ingredient' ? <Package className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
                                {it.itemType === 'ingredient' ? 'MP' : 'Insumo'}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-[#5C3A21]">{it.itemName}</TableCell>
                          <TableCell className="text-right text-sm text-[#4A3F36]">{it.quantity}</TableCell>
                          <TableCell className="text-sm text-[#4A3F36]">{it.unit}</TableCell>
                          <TableCell className="text-right text-sm text-[#4A3F36]">{fmtCurrency(it.pricePerUnit)}</TableCell>
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

            {/* Datos de la compra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Lugar</Label>
                <SelectWithCreate
                  entity="place"
                  value={placeId || '__none__'}
                  onValueChange={(v) => setPlaceId(v === '__none__' ? '' : v)}
                  options={places}
                  placeholder="Sin lugar asignado"
                  allowNone
                  noneLabel="— Sin lugar —"
                  onCreated={(r) => onQuickCreatedPlace?.(r)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Fecha de compra *</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="border-[#5C3A21]/15" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 bg-white border-t border-[#5C3A21]/10 px-6 py-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Check className="h-4 w-4 mr-1" />
              Convertir en Compra
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

export default function CmPedidosProveedoresPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmPedidosProveedoresPageContent />
    </React.Suspense>
  )
}
