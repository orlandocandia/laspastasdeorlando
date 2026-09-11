'use client'

/**
 * ============================================================
 * Proveedores — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/proveedores
 * ABM completo: tabla, filtros, form modal (datos + domicilio + mapa + imagen), exportación.
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Printer, FileText, FileDown, FileSpreadsheet, Pencil, Trash2, MoreHorizontal, Loader2, Building2 } from 'lucide-react'
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
import LocationPicker from '@/components/(cocina-movil)/admin/location-picker'

interface CmSupplier {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  country: string | null
  province: string | null
  department: string | null
  municipality: string | null
  location: string | null
  image: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

type FormMode = 'create' | 'edit'

function CmProveedoresPageContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = React.useState<CmSupplier[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmSupplier | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmSupplier | null>(null)

  React.useEffect(() => {
    if (searchParams.get('action') === 'new') { setFormMode('create'); setEditItem(null); setFormOpen(true) }
  }, [searchParams])

  const loadItems = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/suppliers?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setItems(data.suppliers || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err); toast.error('Error al cargar proveedores')
    } finally { setLoading(false) }
  }, [search, statusFilter])

  React.useEffect(() => { const id = setTimeout(loadItems, 250); return () => clearTimeout(id) }, [loadItems])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }
  const openEdit = (item: CmSupplier) => { setFormMode('edit'); setEditItem(item); setFormOpen(true) }

  const handleToggle = async (item: CmSupplier) => {
    try {
      const res = await fetch(`/api/cocina-movil/suppliers/${item.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !item.isActive }) })
      if (!res.ok) throw new Error()
      toast.success(`Proveedor ${item.isActive ? 'desactivado' : 'activado'}`)
      loadItems()
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/suppliers/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Eliminado'); setDeleteItem(null); loadItems()
    } catch { toast.error('Error al eliminar') }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (statusFilter === 'active') params.set('isActive', 'true')
    if (statusFilter === 'inactive') params.set('isActive', 'false')
    window.open(`/api/cocina-movil/suppliers/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2"><Building2 className="h-6 w-6" />Proveedores</h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]"><Plus className="h-4 w-4" />Nuevo Proveedor</Button>
      </div>

      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input placeholder="Buscar por nombre, contacto, email o teléfono…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-[#5C3A21]/15 bg-white" />
            </div>
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
            <div className="py-16 text-center"><Building2 className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" /><p className="text-sm text-[#8A7E70]">No se encontraron proveedores.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Contacto</TableHead>
                    <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden xl:table-cell">Email</TableHead>
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
                          {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-[#8A7E70]/40" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[#5C3A21]">{item.name}</p>
                        <p className="text-xs text-[#8A7E70] truncate max-w-xs md:hidden">{item.contactName || '—'}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{item.contactName || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-[#4A3F36]">{item.phone || '—'}</TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-[#4A3F36] truncate max-w-xs">{item.email || '—'}</TableCell>
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

      <SupplierFormDialog open={formOpen} mode={formMode} item={editItem} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); loadItems() }} />

      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar proveedor?</DialogTitle>
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

function SupplierFormDialog({ open, mode, item, onClose, onSaved }: { open: boolean; mode: FormMode; item: CmSupplier | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = React.useState({
    name: '', contactName: '', phone: '', email: '', address: '', country: 'Argentina', province: 'Misiones',
    department: '', municipality: '', location: '' as string, image: '' as string, isActive: true,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setForm({
          name: item.name, contactName: item.contactName || '', phone: item.phone || '', email: item.email || '',
          address: item.address || '', country: item.country || 'Argentina', province: item.province || 'Misiones',
          department: item.department || '', municipality: item.municipality || '', location: item.location || '',
          image: item.image || '', isActive: item.isActive,
        })
      } else {
        setForm({
          name: '', contactName: '', phone: '', email: '', address: '', country: 'Argentina', province: 'Misiones',
          department: '', municipality: '', location: '', image: '', isActive: true,
        })
      }
      setError(null)
    }
  }, [open, mode, item])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('El nombre es obligatorio')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('El email es inválido')

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name, contactName: form.contactName || null, phone: form.phone || null,
        email: form.email || null, address: form.address || null, country: form.country || null,
        province: form.province || null, department: form.department || null, municipality: form.municipality || null,
        location: form.location || null, image: form.image || null, isActive: form.isActive,
      }
      const url = mode === 'create' ? '/api/cocina-movil/suppliers' : `/api/cocina-movil/suppliers/${item!.id}`
      const res = await fetch(url, { method: mode === 'create' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Proveedor creado' : 'Proveedor actualizado')
      onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21]">{mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}</DialogTitle>
          <DialogDescription>{mode === 'create' ? 'Agregar proveedor de materias primas o insumos' : `Editando: ${item?.name}`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}

          {/* Sección 1: Datos del Proveedor */}
          <div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">1</div><h3 className="text-sm font-semibold text-[#5C3A21]">Datos del Proveedor</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Nombre *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Razón social" className="border-[#5C3A21]/15" autoFocus /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Contacto</Label><Input value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder="Persona de contacto" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Teléfono</Label><Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="3754-xxxxxx" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Email</Label><Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="email@proveedor.com" className="border-[#5C3A21]/15" /></div>
            {mode === 'edit' && (
              <div className="space-y-1.5 flex items-center gap-3 pt-5"><Label className="text-[#5C3A21]">Activo</Label><Switch checked={form.isActive} onCheckedChange={(v) => setField('isActive', v)} /></div>
            )}
          </div>

          <Separator />
          {/* Sección 2: Domicilio */}
          <div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">2</div><h3 className="text-sm font-semibold text-[#5C3A21]">Domicilio</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Dirección</Label><Input value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Calle, número" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">País</Label><Input value={form.country} onChange={(e) => setField('country', e.target.value)} className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Provincia</Label><Input value={form.province} onChange={(e) => setField('province', e.target.value)} className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Departamento</Label><Input value={form.department} onChange={(e) => setField('department', e.target.value)} className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Municipio</Label><Input value={form.municipality} onChange={(e) => setField('municipality', e.target.value)} className="border-[#5C3A21]/15" /></div>
          </div>
          <div className="pl-10">
            <Label className="text-[#5C3A21] mb-2 block">Ubicación (mapa)</Label>
            <LocationPicker location={form.location || null} onLocationChange={(loc) => setField('location', loc || '')} />
          </div>

          <Separator />
          {/* Sección 3: Imagen */}
          <div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">3</div><h3 className="text-sm font-semibold text-[#5C3A21]">Imagen / Logo</h3></div>
          <div className="pl-10">
            <ImageUploader value={form.image || null} onChange={(url) => setField('image', url || '')} uploadUrl="/api/cocina-movil/suppliers/upload-image" label="Logo o foto del proveedor" aspectRatio="4/3" disabled={saving} />
          </div>

          </div>
          <div className="shrink-0 bg-white border-t border-[#5C3A21]/10 px-6 py-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{mode === 'create' ? 'Crear' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CmProveedoresPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmProveedoresPageContent />
    </React.Suspense>
  )
}
