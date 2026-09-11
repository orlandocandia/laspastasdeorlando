'use client'

/**
 * ============================================================
 * Compras — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/compras
 * ABM completo con formulario master-detail (compra + items dinámicos).
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2, X, Eye,
  ShoppingCart, Package, FlaskConical,
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

interface CmPurchaseItem {
  id: string
  purchaseId: string
  itemType: 'ingredient' | 'supply'
  itemId: string | null
  itemName: string
  quantity: number
  unit: string
  pricePerUnit: number
  subtotal: number
}

interface CmPurchaseRecord {
  id: string
  supplierId: string
  supplierName: string
  placeId: string | null
  placeName: string | null
  purchaseDate: number
  invoiceNumber: string | null
  observations: string | null
  items: CmPurchaseItem[]
  total: number
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

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (value: number): string => `$${Number(value || 0).toLocaleString('es-AR')}`

const fmtDate = (epoch: number): string => {
  const d = new Date(epoch)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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

function CmComprasPageContent() {
  const searchParams = useSearchParams()
  const [purchases, setPurchases] = React.useState<CmPurchaseRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [supplierFilter, setSupplierFilter] = React.useState<string>('all')
  const [placeFilter, setPlaceFilter] = React.useState<string>('all')
  const [periodFilter, setPeriodFilter] = React.useState<'all' | 'today' | '7d' | '30d'>('all')

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmPurchaseRecord | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmPurchaseRecord | null>(null)
  const [viewItem, setViewItem] = React.useState<CmPurchaseRecord | null>(null)

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
        setIngredients((iData.ingredients || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({ id: x.id, name: x.name, purchaseUnit: x.purchaseUnit, purchasePrice: x.purchasePrice })))
        setSupplies((supData.supplies || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({ id: x.id, name: x.name, purchaseUnit: x.purchaseUnit, purchasePrice: x.purchasePrice })))
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

  const loadPurchases = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (supplierFilter !== 'all') params.set('supplierId', supplierFilter)
      if (placeFilter !== 'all') params.set('placeId', placeFilter)
      if (periodFilter !== 'all') {
        const now = Date.now()
        const dayMs = 86400000
        let from: number
        if (periodFilter === 'today') {
          const d = new Date(); d.setHours(0, 0, 0, 0)
          from = d.getTime()
        } else if (periodFilter === '7d') {
          from = now - 7 * dayMs
        } else {
          from = now - 30 * dayMs
        }
        params.set('dateFrom', String(from))
      }
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/purchases?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setPurchases(data.purchases || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar compras')
    } finally {
      setLoading(false)
    }
  }, [search, supplierFilter, placeFilter, periodFilter])

  React.useEffect(() => {
    const id = setTimeout(loadPurchases, 250)
    return () => clearTimeout(id)
  }, [loadPurchases])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }
  const openEdit = (item: CmPurchaseRecord) => { setFormMode('edit'); setEditItem(item); setFormOpen(true) }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/purchases/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Compra eliminada')
      setDeleteItem(null)
      loadPurchases()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (supplierFilter !== 'all') params.set('supplierId', supplierFilter)
    if (placeFilter !== 'all') params.set('placeId', placeFilter)
    window.open(`/api/cocina-movil/purchases/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />Compras
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nueva Compra
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar proveedor, factura, item…"
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
            <Select value={placeFilter} onValueChange={setPlaceFilter}>
              <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Lugar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los lugares</SelectItem>
                {places.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as 'all' | 'today' | '7d' | '30d')}>
              <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fechas</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
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
          ) : purchases.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron compras.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="hidden md:table-cell">Lugar</TableHead>
                    <TableHead className="hidden lg:table-cell">Factura</TableHead>
                    <TableHead className="text-center">Cant. Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p, i) => (
                    <TableRow key={p.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell className="text-sm text-[#4A3F36] whitespace-nowrap">{fmtDate(p.purchaseDate)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[#5C3A21]">{p.supplierName}</p>
                        <p className="text-xs text-[#8A7E70] md:hidden">{p.placeName || '—'}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{p.placeName || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-[#4A3F36]">{p.invoiceNumber || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-[#5C3A21]/10 text-[#5C3A21] hover:bg-[#5C3A21]/15">{p.items.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">{fmtCurrency(p.total)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewItem(p)}><Eye className="h-4 w-4 mr-2" />Ver Detalle</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(p)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
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
      <PurchaseFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        suppliers={suppliers}
        places={places}
        ingredients={ingredients}
        supplies={supplies}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadPurchases() }}
        onQuickCreated={(entity, record) => {
          if (entity === 'supplier') setSuppliers((arr) => [...arr, { id: record.id, name: record.name, purchaseUnit: '', purchasePrice: 0 }])
          else if (entity === 'place') setPlaces((arr) => [...arr, { id: record.id, name: record.name, purchaseUnit: '', purchasePrice: 0 }])
          else if (entity === 'ingredient') setIngredients((arr) => [...arr, { id: record.id, name: record.name, purchaseUnit: '', purchasePrice: 0 }])
          else if (entity === 'supply') setSupplies((arr) => [...arr, { id: record.id, name: record.name, purchaseUnit: '', purchasePrice: 0 }])
        }}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar compra?</DialogTitle>
            <DialogDescription>
              Estás por eliminar la compra a <strong>{deleteItem?.supplierName}</strong> del{' '}
              <strong>{deleteItem ? fmtDate(deleteItem.purchaseDate) : ''}</strong> por un total de{' '}
              <strong>{deleteItem ? fmtCurrency(deleteItem.total) : ''}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancelar</Button>
            <Button onClick={handleDelete} className="bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white"><Trash2 className="h-4 w-4" />Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <PurchaseViewDialog item={viewItem} onClose={() => setViewItem(null)} />
    </div>
  )
}

// ============================================================
// Form Dialog (master-detail)
// ============================================================

interface PurchaseFormDialogProps {
  open: boolean
  mode: FormMode
  item: CmPurchaseRecord | null
  suppliers: OptionItem[]
  places: OptionItem[]
  ingredients: OptionItem[]
  supplies: OptionItem[]
  onClose: () => void
  onSaved: () => void
  onQuickCreated?: (entity: QuickCreateEntity, record: SelectOption) => void
}

function PurchaseFormDialog({ open, mode, item, suppliers, places, ingredients, supplies, onClose, onSaved, onQuickCreated }: PurchaseFormDialogProps) {
  const [supplierId, setSupplierId] = React.useState('')
  const [placeId, setPlaceId] = React.useState('')
  const [purchaseDate, setPurchaseDate] = React.useState(epochToDateInput(Date.now()))
  const [invoiceNumber, setInvoiceNumber] = React.useState('')
  const [observations, setObservations] = React.useState('')
  const [items, setItems] = React.useState<FormItem[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setSupplierId(item.supplierId)
        setPlaceId(item.placeId || '')
        setPurchaseDate(epochToDateInput(item.purchaseDate))
        setInvoiceNumber(item.invoiceNumber || '')
        setObservations(item.observations || '')
        setItems(item.items.map((it) => ({
          key: newItemKey(),
          itemType: it.itemType,
          itemId: it.itemId || '',
          quantity: it.quantity,
          unit: it.unit,
          pricePerUnit: it.pricePerUnit,
        })))
      } else {
        setSupplierId('')
        setPlaceId('')
        setPurchaseDate(epochToDateInput(Date.now()))
        setInvoiceNumber('')
        setObservations('')
        setItems([{ key: newItemKey(), itemType: 'ingredient', itemId: '', quantity: 1, unit: '', pricePerUnit: 0 }])
      }
      setError(null)
    }
  }, [open, mode, item])

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0)

  const addItem = () => {
    setItems((arr) => [...arr, { key: newItemKey(), itemType: 'ingredient', itemId: '', quantity: 1, unit: '', pricePerUnit: 0 }])
  }

  const removeItem = (key: string) => {
    setItems((arr) => arr.filter((it) => it.key !== key))
  }

  const updateItem = (key: string, patch: Partial<FormItem>) => {
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }

  const onItemTypeChange = (key: string, newType: 'ingredient' | 'supply') => {
    updateItem(key, { itemType: newType, itemId: '', unit: '', pricePerUnit: 0 })
  }

  const onProductSelect = (key: string, productId: string) => {
    const it = items.find((x) => x.key === key)
    if (!it) return
    const pool = it.itemType === 'ingredient' ? ingredients : supplies
    const prod = pool.find((p) => p.id === productId)
    updateItem(key, {
      itemId: productId,
      unit: prod?.purchaseUnit || '',
      pricePerUnit: prod?.purchasePrice || 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!supplierId) return setError('El proveedor es obligatorio')
    const validItems = items.filter((it) => it.itemId && Number(it.quantity) > 0)
    if (validItems.length === 0) return setError('Debe agregar al menos un item con producto y cantidad')
    for (const it of validItems) {
      if (Number(it.pricePerUnit) < 0) return setError('El precio no puede ser negativo para un item')
    }

    setSaving(true)
    try {
      const body = {
        supplierId,
        placeId: placeId || null,
        purchaseDate: dateInputToEpoch(purchaseDate),
        invoiceNumber: invoiceNumber.trim() || null,
        observations: observations.trim() || null,
        items: validItems.map((it) => ({
          itemType: it.itemType,
          itemId: it.itemId,
          quantity: Number(it.quantity),
          unit: it.unit || 'u',
          pricePerUnit: Number(it.pricePerUnit),
        })),
      }
      const url = mode === 'create' ? '/api/cocina-movil/purchases' : `/api/cocina-movil/purchases/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Compra creada' : 'Compra actualizada')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {mode === 'create' ? 'Nueva Compra' : 'Editar Compra'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Registrar una compra con su detalle de items.' : `Editando compra de ${item?.supplierName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
          )}

          {/* MASTER: Datos generales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Proveedor *</Label>
              <SelectWithCreate
                entity="supplier"
                value={supplierId}
                onValueChange={setSupplierId}
                options={suppliers}
                placeholder="Seleccionar proveedor"
                onCreated={(r) => onQuickCreated?.('supplier', r)}
              />
            </div>
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
                onCreated={(r) => onQuickCreated?.('place', r)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Fecha *</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="border-[#5C3A21]/15" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Número de Factura</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Ej: A-0001-00001234" className="border-[#5C3A21]/15" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[#5C3A21]">Observaciones</Label>
              <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Notas internas sobre la compra…" rows={2} className="border-[#5C3A21]/15 resize-none" />
            </div>
          </div>

          <Separator />

          {/* DETAIL: Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
                <Package className="h-4 w-4" />Detalle de Compra
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="border-[#5C3A21]/20 text-[#5C3A21]">
                <Plus className="h-3.5 w-3.5" />Agregar Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#5C3A21]/20 rounded-md">
                <p className="text-sm text-[#8A7E70]">No hay items. Hacé clic en &quot;Agregar Item&quot;.</p>
              </div>
            ) : (
              <>
                {/* Header de grilla (desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-[#8A7E70]">
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-1 text-right">Cant.</div>
                  <div className="col-span-1">Unidad</div>
                  <div className="col-span-2 text-right">Precio/U</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="space-y-2">
                  {items.map((it) => {
                    const pool = it.itemType === 'ingredient' ? ingredients : supplies
                    const subtotal = (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0)
                    return (
                      <div key={it.key} className="grid grid-cols-2 lg:grid-cols-12 gap-2 p-2 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
                        {/* Tipo */}
                        <div className="col-span-2 lg:col-span-2">
                          <Label className="text-[10px] text-[#8A7E70] lg:hidden">Tipo</Label>
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
                        <div className="col-span-2 lg:col-span-4">
                          <Label className="text-[10px] text-[#8A7E70] lg:hidden">Producto</Label>
                          <SelectWithCreate
                            entity={it.itemType}
                            value={it.itemId}
                            onValueChange={(v) => onProductSelect(it.key, v)}
                            options={pool}
                            placeholder={it.itemType === 'ingredient' ? 'Seleccionar materia prima…' : 'Seleccionar insumo…'}
                            compact
                            triggerClassName="h-9 border-[#5C3A21]/15 text-xs"
                            onCreated={(r) => {
                              onQuickCreated?.(it.itemType, r)
                            }}
                          />
                        </div>

                        {/* Cantidad */}
                        <div className="col-span-1 lg:col-span-1">
                          <Label className="text-[10px] text-[#8A7E70] lg:hidden">Cant.</Label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={it.quantity}
                            onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) })}
                            className="h-9 border-[#5C3A21]/15 text-xs text-right"
                          />
                        </div>

                        {/* Unidad */}
                        <div className="col-span-1 lg:col-span-1">
                          <Label className="text-[10px] text-[#8A7E70] lg:hidden">Unidad</Label>
                          <Input
                            value={it.unit}
                            onChange={(e) => updateItem(it.key, { unit: e.target.value })}
                            placeholder="kg"
                            className="h-9 border-[#5C3A21]/15 text-xs"
                          />
                        </div>

                        {/* Precio/U */}
                        <div className="col-span-2 lg:col-span-2">
                          <Label className="text-[10px] text-[#8A7E70] lg:hidden">Precio/U</Label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={it.pricePerUnit}
                            onChange={(e) => updateItem(it.key, { pricePerUnit: Number(e.target.value) })}
                            className="h-9 border-[#5C3A21]/15 text-xs text-right"
                          />
                        </div>

                        {/* Subtotal + Remove */}
                        <div className="col-span-2 lg:col-span-2 flex items-center justify-end gap-1">
                          <div className="flex-1 text-right text-sm font-semibold text-[#5C3A21]">
                            {fmtCurrency(subtotal)}
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(it.key)}
                            className="h-8 w-8 text-[#B91C1C] hover:bg-[#B91C1C]/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer sticky: Total + acciones */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 px-6 pb-4 pt-3 border-t border-[#5C3A21]/10 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-[#8A7E70]">Total:</span>
              <span className="text-xl font-bold text-[#5C3A21]">{fmtCurrency(total)}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
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
// View Dialog (detalle de compra)
// ============================================================

function PurchaseViewDialog({ item, onClose }: { item: CmPurchaseRecord | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Eye className="h-5 w-5" />Detalle de Compra
          </DialogTitle>
          <DialogDescription>
            {item ? `Compra a ${item.supplierName} — ${fmtDate(item.purchaseDate)}` : ''}
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="space-y-4">
            {/* Datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-md bg-[#FFF8E7]/50 border border-[#5C3A21]/10">
              <div>
                <p className="text-xs text-[#8A7E70]">Proveedor</p>
                <p className="text-sm font-medium text-[#5C3A21]">{item.supplierName}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A7E70]">Lugar</p>
                <p className="text-sm text-[#4A3F36]">{item.placeName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A7E70]">Fecha</p>
                <p className="text-sm text-[#4A3F36]">{fmtDate(item.purchaseDate)}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A7E70]">Factura</p>
                <p className="text-sm text-[#4A3F36]">{item.invoiceNumber || '—'}</p>
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

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Export (con Suspense)
// ============================================================

export default function CmComprasPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmComprasPageContent />
    </React.Suspense>
  )
}
