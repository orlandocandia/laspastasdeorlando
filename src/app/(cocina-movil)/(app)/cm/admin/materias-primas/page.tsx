'use client'

/**
 * ============================================================
 * Materias Primas — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/materias-primas
 * ABM completo: tabla, filtros, form modal, exportación.
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Printer, FileText, FileDown, FileSpreadsheet, Pencil, Trash2, MoreHorizontal, Loader2, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import ImageUploader from '@/components/(cocina-movil)/admin/image-uploader'

type CmIngredientCategory = 'harinas' | 'carnes' | 'lacteos' | 'verduras' | 'especias' | 'aceites' | 'otros'
type CmUnit = 'kg' | 'g' | 'l' | 'ml' | 'u' | 'paquete' | 'docena'

interface CmIngredient {
  id: string
  name: string
  description: string | null
  category: CmIngredientCategory | null
  purchaseUnit: CmUnit
  purchasePrice: number
  gramsPerUnit: number | null
  image: string | null
  supplierId: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

type FormMode = 'create' | 'edit'

const CATEGORIES: { value: CmIngredientCategory; label: string }[] = [
  { value: 'harinas', label: 'Harinas' },
  { value: 'carnes', label: 'Carnes' },
  { value: 'lacteos', label: 'Lácteos' },
  { value: 'verduras', label: 'Verduras' },
  { value: 'especias', label: 'Especias' },
  { value: 'aceites', label: 'Aceites' },
  { value: 'otros', label: 'Otros' },
]

const UNITS: CmUnit[] = ['kg', 'g', 'l', 'ml', 'u', 'paquete', 'docena']

function CmMateriasPrimasPageContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = React.useState<CmIngredient[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [catFilter, setCatFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmIngredient | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmIngredient | null>(null)

  React.useEffect(() => {
    if (searchParams.get('action') === 'new') { setFormMode('create'); setEditItem(null); setFormOpen(true) }
  }, [searchParams])

  const loadItems = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (catFilter !== 'all') params.set('category', catFilter)
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/ingredients?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setItems(data.ingredients || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err); toast.error('Error al cargar materias primas')
    } finally { setLoading(false) }
  }, [search, catFilter, statusFilter])

  React.useEffect(() => { const id = setTimeout(loadItems, 250); return () => clearTimeout(id) }, [loadItems])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }
  const openEdit = (item: CmIngredient) => { setFormMode('edit'); setEditItem(item); setFormOpen(true) }

  const handleToggle = async (item: CmIngredient) => {
    try {
      const res = await fetch(`/api/cocina-movil/ingredients/${item.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !item.isActive }) })
      if (!res.ok) throw new Error()
      toast.success(`Materia prima ${item.isActive ? 'desactivada' : 'activada'}`)
      loadItems()
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/ingredients/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Eliminada'); setDeleteItem(null); loadItems()
    } catch { toast.error('Error al eliminar') }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (catFilter !== 'all') params.set('category', catFilter)
    if (statusFilter === 'active') params.set('isActive', 'true')
    if (statusFilter === 'inactive') params.set('isActive', 'false')
    window.open(`/api/cocina-movil/ingredients/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2"><Package className="h-6 w-6" />Materias Primas</h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]"><Plus className="h-4 w-4" />Nueva Materia Prima</Button>
      </div>

      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input placeholder="Buscar por nombre o descripción…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-[#5C3A21]/15 bg-white" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-full lg:w-44 border-[#5C3A21]/15"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="w-full lg:w-40 border-[#5C3A21]/15"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
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

      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" /><span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span></div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center"><Package className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" /><p className="text-sm text-[#8A7E70]">No se encontraron materias primas.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={item.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        <div className="h-10 w-12 rounded overflow-hidden bg-[#FBF1DC] flex items-center justify-center">
                          {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-[#8A7E70]/40" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[#5C3A21]">{item.name}</p>
                        {item.description && <p className="text-xs text-[#8A7E70] truncate max-w-xs">{item.description}</p>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.category && <Badge variant="outline" className="text-[10px] capitalize border-[#5C3A21]/20">{item.category}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-[#4A3F36]">{item.purchaseUnit}</TableCell>
                      <TableCell className="text-sm font-medium text-[#5C3A21]">${item.purchasePrice.toLocaleString('es-AR')}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${item.isActive ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#8A7E70] hover:bg-[#8A7E70]'}`}>{item.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(item)}><Switch checked={item.isActive} className="scale-75 mr-1" />{item.isActive ? 'Desactivar' : 'Activar'}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
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

      <IngredientFormDialog open={formOpen} mode={formMode} item={editItem} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); loadItems() }} />

      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar materia prima?</DialogTitle>
            <DialogDescription>Estás por eliminar <strong>{deleteItem?.name}</strong>. Esta acción no se puede deshacer.</DialogDescription>
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

function IngredientFormDialog({ open, mode, item, onClose, onSaved }: { open: boolean; mode: FormMode; item: CmIngredient | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = React.useState({
    name: '', description: '', category: '' as string, purchaseUnit: 'kg' as CmUnit, purchasePrice: '', gramsPerUnit: '', image: '' as string, isActive: true,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setForm({ name: item.name, description: item.description || '', category: item.category || '', purchaseUnit: item.purchaseUnit, purchasePrice: String(item.purchasePrice), gramsPerUnit: item.gramsPerUnit ? String(item.gramsPerUnit) : '', image: item.image || '', isActive: item.isActive })
      } else {
        setForm({ name: '', description: '', category: '', purchaseUnit: 'kg', purchasePrice: '', gramsPerUnit: '', image: '', isActive: true })
      }
      setError(null)
    }
  }, [open, mode, item])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('El nombre es obligatorio')
    const price = parseFloat(form.purchasePrice)
    if (isNaN(price) || price < 0) return setError('El precio debe ser un número válido')

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name, description: form.description || null,
        category: form.category || null, purchaseUnit: form.purchaseUnit,
        purchasePrice: price,
        gramsPerUnit: form.gramsPerUnit ? parseFloat(form.gramsPerUnit) : null,
        image: form.image || null, isActive: form.isActive,
      }
      const url = mode === 'create' ? '/api/cocina-movil/ingredients' : `/api/cocina-movil/ingredients/${item!.id}`
      const res = await fetch(url, { method: mode === 'create' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Materia prima creada' : 'Materia prima actualizada')
      onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21]">{mode === 'create' ? 'Nueva Materia Prima' : 'Editar Materia Prima'}</DialogTitle>
          <DialogDescription>{mode === 'create' ? 'Agregar ingrediente para recetas y producción' : `Editando: ${item?.name}`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}

          <div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">1</div><h3 className="text-sm font-semibold text-[#5C3A21]">Datos de la Materia Prima</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Nombre *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} className="border-[#5C3A21]/15" autoFocus /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Categoría</Label><Select value={form.category || 'none'} onValueChange={(v) => setField('category', v === 'none' ? '' : v)}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Sin categoría" /></SelectTrigger><SelectContent><SelectItem value="none">— Sin categoría —</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Descripción</Label><Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="border-[#5C3A21]/15" rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Unidad de Compra</Label><Select value={form.purchaseUnit} onValueChange={(v) => setField('purchaseUnit', v as CmUnit)}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger><SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Precio por Unidad ($)</Label><Input type="number" step="0.01" min="0" value={form.purchasePrice} onChange={(e) => setField('purchasePrice', e.target.value)} className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Conversión a Gramos (opcional)</Label><Input type="number" step="0.01" min="0" value={form.gramsPerUnit} onChange={(e) => setField('gramsPerUnit', e.target.value)} placeholder="ej: 1000 para 1kg" className="border-[#5C3A21]/15" /></div>
            {mode === 'edit' && (
              <div className="space-y-1.5 flex items-center gap-3 pt-5"><Label className="text-[#5C3A21]">Activo</Label><Switch checked={form.isActive} onCheckedChange={(v) => setField('isActive', v)} /></div>
            )}
          </div>

          <Separator />
          <div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">2</div><h3 className="text-sm font-semibold text-[#5C3A21]">Imagen</h3></div>
          <div className="pl-10">
            <ImageUploader value={form.image || null} onChange={(url) => setField('image', url || '')} uploadUrl="/api/cocina-movil/ingredients/upload-image" label="Imagen de la materia prima" aspectRatio="4/3" disabled={saving} />
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 px-6 pb-4 pt-3 border-t border-[#5C3A21]/10 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{mode === 'create' ? 'Crear' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CmMateriasPrimasPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmMateriasPrimasPageContent />
    </React.Suspense>
  )
}
