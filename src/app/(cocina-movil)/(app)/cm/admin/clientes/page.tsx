'use client'

/**
 * ============================================================
 * Clientes — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/clientes
 * ABM completo: tabla, filtros (búsqueda + estado), exportación,
 * form modal (datos personales + dirección + notas) y baja.
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Users, Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2, X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ---------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------
interface CmClient {
  id: string
  firstName: string
  lastName: string
  fullName: string
  dni: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  birthDate: number | null
  notes: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

type FormMode = 'create' | 'edit'

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function fmtDate(epoch: number | null): string {
  if (!epoch) return '—'
  const d = new Date(epoch)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function epochToDateInput(epoch: number | null): string {
  if (!epoch) return ''
  const d = new Date(epoch)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function dateInputToEpoch(value: string): number | null {
  if (!value) return null
  const parts = value.split('-').map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return null
  const [yyyy, mm, dd] = parts
  const d = new Date(yyyy, mm - 1, dd, 12, 0, 0)
  return d.getTime()
}

// ===============================================================
// CONTENIDO PRINCIPAL
// ===============================================================
function CmClientesPageContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = React.useState<CmClient[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmClient | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmClient | null>(null)

  // Deep link ?action=new
  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormMode('create')
      setEditItem(null)
      setFormOpen(true)
    }
  }, [searchParams])

  const loadItems = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/clients?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setItems(data.clients || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  // Debounce 250ms
  React.useEffect(() => {
    const id = setTimeout(loadItems, 250)
    return () => clearTimeout(id)
  }, [loadItems])

  const openCreate = () => {
    setFormMode('create')
    setEditItem(null)
    setFormOpen(true)
  }

  const openEdit = (item: CmClient) => {
    setFormMode('edit')
    setEditItem(item)
    setFormOpen(true)
  }

  const handleToggle = async (item: CmClient) => {
    try {
      const res = await fetch(`/api/cocina-movil/clients/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Cliente ${item.isActive ? 'desactivado' : 'activado'}`)
      loadItems()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/clients/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Cliente eliminado')
      setDeleteItem(null)
      loadItems()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (statusFilter === 'active') params.set('isActive', 'true')
    if (statusFilter === 'inactive') params.set('isActive', 'false')
    window.open(`/api/cocina-movil/clients/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <Users className="h-6 w-6" />Clientes
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nuevo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por nombre, DNI, teléfono o email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="w-full lg:w-44 border-[#5C3A21]/15">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#5C3A21]/8">
            <span className="text-xs text-[#8A7E70] self-center mr-1">Exportar:</span>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <Printer className="h-3.5 w-3.5" />Imprimir
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('pdf')} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <FileText className="h-3.5 w-3.5" />PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('word')} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <FileDown className="h-3.5 w-3.5" />Word
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('excel')} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <FileSpreadsheet className="h-3.5 w-3.5" />Excel
            </Button>
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
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron clientes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">DNI</TableHead>
                    <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden xl:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Ciudad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={item.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[#5C3A21]">{item.fullName}</p>
                        <p className="text-xs text-[#8A7E70] md:hidden">
                          {item.dni || '—'} · {item.phone || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{item.dni || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-[#4A3F36]">{item.phone || '—'}</TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-[#4A3F36] truncate max-w-xs">{item.email || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{item.city || '—'}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${item.isActive ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#B91C1C] hover:bg-[#B91C1C]'}`}>
                          {item.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(item)}>
                              <Switch checked={item.isActive} className="scale-75 mr-1" />
                              {item.isActive ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-[#B91C1C] focus:text-[#B91C1C]">
                              <Trash2 className="h-4 w-4 mr-2" />Eliminar
                            </DropdownMenuItem>
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
      <ClientFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadItems() }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Estás por eliminar a <strong>{deleteItem?.fullName}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancelar</Button>
            <Button onClick={handleDelete} className="bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white">
              <Trash2 className="h-4 w-4" />Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===============================================================
// FORM DIALOG
// ===============================================================
function ClientFormDialog({
  open, mode, item, onClose, onSaved,
}: {
  open: boolean
  mode: FormMode
  item: CmClient | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = React.useState({
    firstName: '', lastName: '', dni: '', phone: '', email: '',
    address: '', city: '', birthDate: '', notes: '', isActive: true,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setForm({
          firstName: item.firstName,
          lastName: item.lastName,
          dni: item.dni || '',
          phone: item.phone || '',
          email: item.email || '',
          address: item.address || '',
          city: item.city || '',
          birthDate: epochToDateInput(item.birthDate),
          notes: item.notes || '',
          isActive: item.isActive,
        })
      } else {
        setForm({
          firstName: '', lastName: '', dni: '', phone: '', email: '',
          address: '', city: '', birthDate: '', notes: '', isActive: true,
        })
      }
      setError(null)
    }
  }, [open, mode, item])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.firstName.trim()) return setError('El nombre es obligatorio')
    if (!form.lastName.trim()) return setError('El apellido es obligatorio')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError('El email es inválido')
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dni: form.dni || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        birthDate: form.birthDate ? dateInputToEpoch(form.birthDate) : null,
        notes: form.notes || null,
      }
      // isActive only sent in edit mode (creation defaults to true server-side)
      if (mode === 'edit') body.isActive = form.isActive

      const url = mode === 'create'
        ? '/api/cocina-movil/clients'
        : `/api/cocina-movil/clients/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)

      toast.success(mode === 'create' ? 'Cliente creado' : 'Cliente actualizado')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21]">
            {mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Registrar un nuevo cliente para ventas, pedidos y presupuestos'
              : `Editando: ${item?.fullName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
            {error && (
              <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Sección 1: Datos Personales */}
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">1</div>
              <h3 className="text-sm font-semibold text-[#5C3A21]">Datos Personales</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Nombre *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  placeholder="Nombre"
                  className="border-[#5C3A21]/15"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Apellido *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  placeholder="Apellido"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">DNI</Label>
                <Input
                  value={form.dni}
                  onChange={(e) => setField('dni', e.target.value)}
                  placeholder="30-12345678-9"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="3794-xxxxxx"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="email@cliente.com"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Ciudad</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="Posadas"
                  className="border-[#5C3A21]/15"
                />
              </div>
            </div>

            <Separator />

            {/* Sección 2: Dirección y Contacto */}
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">2</div>
              <h3 className="text-sm font-semibold text-[#5C3A21]">Dirección y Notas</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 pl-10">
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Dirección</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Calle, número, barrio"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Notas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Observaciones, preferencias, historial…"
                  className="border-[#5C3A21]/15 min-h-[80px] resize-y"
                  rows={3}
                />
              </div>
            </div>

            {mode === 'edit' && (
              <>
                <Separator />
                <div className="flex items-center gap-3 pl-10">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setField('isActive', v)} />
                  <Label className="text-[#5C3A21] cursor-pointer">
                    Cliente {form.isActive ? 'activo' : 'inactivo'}
                  </Label>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 bg-white border-t border-[#5C3A21]/10 px-6 py-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ===============================================================
// DEFAULT EXPORT (con Suspense — requerido por useSearchParams en Next 16)
// ===============================================================
export default function CmClientesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
        </div>
      }
    >
      <CmClientesPageContent />
    </React.Suspense>
  )
}
