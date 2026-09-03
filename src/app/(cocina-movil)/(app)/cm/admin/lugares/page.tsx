'use client'

/**
 * ============================================================
 * Gestión de Lugares (ABM) — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/lugares
 *
 * Funcionalidades:
 *  - Tabla de lugares con columnas: #, Imagen, Nombre (con
 *    descripción), Dirección, Responsable, Estado, Acciones
 *  - Búsqueda por nombre / descripción / dirección / contacto
 *    (debounce 250ms)
 *  - Filtro por estado (Todos/Activos/Inactivos)
 *  - Acciones por fila (dropdown): Editar, Activar/Desactivar,
 *    Eliminar
 *  - Botón "Nuevo Lugar" (abre modal)
 *  - Exportación: Imprimir, PDF, Word, Excel
 *
 * Modal de formulario (Crear/Editar) con 4 secciones:
 *   1. Datos del Lugar (name, description, contactName,
 *      contactPhone, contactEmail)
 *   2. Domicilio (address, country, province, department,
 *      municipality, location con LocationPicker/Leaflet)
 *   3. Imagen (ImageUploader rectangular, 4:3)
 *   4. Costos Fijos (isOwned [Propio/Alquilado], rentCost
 *      [solo si alquilado], utilityCost, otherFixedCosts)
 *
 * Paleta: marron #5C3A21, mostaza #E1AD01, crema #FFF8E7,
 *         oliva #708238, rojo #B91C1C, gris medio #8A7E70
 * ============================================================
 */

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Printer, FileText, FileSpreadsheet, FileDown,
  Pencil, Trash2, MoreHorizontal, Loader2, MapPin, Building,
  Home,
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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

import LocationPicker from '@/components/(cocina-movil)/admin/location-picker'
import ImageUploader from '@/components/(cocina-movil)/admin/image-uploader'
import { type CmPlaceRecord } from '@/lib/cocina-movil/places'

type FormMode = 'create' | 'edit'

const DEFAULT_COUNTRY = 'Argentina'
const DEFAULT_PROVINCE = 'Misiones'

// ============================================================
// Helpers
// ============================================================

// Convierte un valor string de input number a number | null
// (vacío => null, NaN => null)
function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null
  const n = Number(value)
  return isNaN(n) ? null : n
}

// ============================================================
// Estado del formulario (campos strings para inputs controlados)
// ============================================================
interface PlaceFormState {
  name: string
  description: string
  contactName: string
  contactPhone: string
  contactEmail: string
  address: string
  country: string
  province: string
  department: string
  municipality: string
  location: string | null // 'lat,lng'
  image: string | null
  isOwned: boolean
  rentCost: string // string para input, se convierte al guardar
  utilityCost: string
  otherFixedCosts: string
  isActive: boolean
}

function emptyForm(): PlaceFormState {
  return {
    name: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    country: DEFAULT_COUNTRY,
    province: DEFAULT_PROVINCE,
    department: '',
    municipality: '',
    location: null,
    image: null,
    isOwned: true,
    rentCost: '',
    utilityCost: '',
    otherFixedCosts: '',
    isActive: true,
  }
}

function formFromPlace(p: CmPlaceRecord): PlaceFormState {
  return {
    name: p.name,
    description: p.description || '',
    contactName: p.contactName || '',
    contactPhone: p.contactPhone || '',
    contactEmail: p.contactEmail || '',
    address: p.address || '',
    country: p.country || DEFAULT_COUNTRY,
    province: p.province || DEFAULT_PROVINCE,
    department: p.department || '',
    municipality: p.municipality || '',
    location: p.location,
    image: p.image,
    isOwned: p.isOwned,
    rentCost: p.rentCost != null ? String(p.rentCost) : '',
    utilityCost: p.utilityCost != null ? String(p.utilityCost) : '',
    otherFixedCosts: p.otherFixedCosts != null ? String(p.otherFixedCosts) : '',
    isActive: p.isActive,
  }
}

// ============================================================
// Componente principal (wrapper con Suspense)
// ============================================================
export default function CmLugaresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
          <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
        </div>
      }
    >
      <CmLugaresPageContent />
    </Suspense>
  )
}

function CmLugaresPageContent() {
  const searchParams = useSearchParams()
  const [places, setPlaces] = React.useState<CmPlaceRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')

  // Modales
  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editingPlace, setEditingPlace] = React.useState<CmPlaceRecord | null>(null)
  const [deletePlace, setDeletePlace] = React.useState<CmPlaceRecord | null>(null)

  // Abrir modal de creación si viene ?action=new
  const openCreateForm = React.useCallback(() => {
    setFormMode('create')
    setEditingPlace(null)
    setFormOpen(true)
  }, [])

  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateForm()
    }
  }, [searchParams, openCreateForm])

  const loadPlaces = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/places?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setPlaces(data.places || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('[CmLugares] Error loading places:', err)
      toast.error('Error al cargar lugares')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  React.useEffect(() => {
    const id = setTimeout(loadPlaces, 250)
    return () => clearTimeout(id)
  }, [loadPlaces])

  // ----- Handlers -----
  const openEditForm = (p: CmPlaceRecord) => {
    setFormMode('edit')
    setEditingPlace(p)
    setFormOpen(true)
  }

  const handleToggleActive = async (p: CmPlaceRecord) => {
    try {
      const res = await fetch(`/api/cocina-movil/places/${p.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      toast.success(`Lugar ${p.isActive ? 'desactivado' : 'activado'}`)
      loadPlaces()
    } catch (err) {
      toast.error('Error al cambiar estado')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!deletePlace) return
    try {
      const res = await fetch(`/api/cocina-movil/places/${deletePlace.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'HTTP ' + res.status)
      }
      toast.success('Lugar eliminado')
      setDeletePlace(null)
      loadPlaces()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (statusFilter === 'active') params.set('isActive', 'true')
    if (statusFilter === 'inactive') params.set('isActive', 'false')
    window.open(`/api/cocina-movil/places/export?${params.toString()}`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  // ----- Render -----
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Lugares
          </h1>
          <p className="text-sm text-[#8A7E70]">
            {total} lugar{total !== 1 ? 'es' : ''} en total
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />
          Nuevo Lugar
        </Button>
      </div>

      {/* Filtros + búsqueda + export */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por nombre, dirección o responsable…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            {/* Estado filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
            >
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

          {/* Export buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#5C3A21]/8">
            <span className="text-xs text-[#8A7E70] self-center mr-1">Exportar:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="border-[#5C3A21]/20 text-[#5C3A21]"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="border-[#5C3A21]/20 text-[#5C3A21]"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('word')}
              className="border-[#5C3A21]/20 text-[#5C3A21]"
            >
              <FileDown className="h-3.5 w-3.5" />
              Word
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('excel')}
              className="border-[#5C3A21]/20 text-[#5C3A21]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de lugares */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
              <span className="ml-2 text-sm text-[#8A7E70]">Cargando lugares…</span>
            </div>
          ) : places.length === 0 ? (
            <div className="py-16 text-center">
              <MapPin className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron lugares.</p>
              <p className="text-xs text-[#8A7E70]/70 mt-1">
                Probá cambiar los filtros o crear uno nuevo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="w-[100px]">Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Dirección</TableHead>
                    <TableHead className="hidden md:table-cell">Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {places.map((p, i) => (
                    <TableRow key={p.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        <div className="h-[60px] w-[80px] rounded-md overflow-hidden bg-[#FBF1DC] ring-1 ring-[#5C3A21]/10 flex items-center justify-center shrink-0">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Si falla la carga, ocultar img y mostrar ícono
                                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <Building className="h-6 w-6 text-[#8A7E70]/50" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#5C3A21] truncate">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-[#8A7E70] truncate max-w-[260px]">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">
                        {p.address || (
                          <span className="text-[#8A7E70]/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">
                        {p.contactName || (
                          <span className="text-[#8A7E70]/60">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            p.isActive
                              ? 'bg-[#708238] hover:bg-[#708238]'
                              : 'bg-[#8A7E70] hover:bg-[#8A7E70]'
                          }`}
                        >
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-[#5C3A21]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditForm(p)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(p)}>
                                <Switch checked={p.isActive} className="scale-75 mr-1" />
                                {p.isActive ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletePlace(p)}
                                className="text-[#B91C1C] focus:text-[#B91C1C]"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== Modal: Crear/Editar Lugar ====== */}
      <PlaceFormDialog
        open={formOpen}
        mode={formMode}
        place={editingPlace}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          loadPlaces()
        }}
      />

      {/* ====== Modal: Confirmar Eliminación ====== */}
      <Dialog open={!!deletePlace} onOpenChange={(o) => !o && setDeletePlace(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar lugar?</DialogTitle>
            <DialogDescription>
              Estás por eliminar <strong>{deletePlace?.name}</strong>.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletePlace(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Sub-componente: header de sección numerada
// ============================================================
function SectionHeader({ num, title, hint }: { num: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold shrink-0">
        {num}
      </div>
      <h3 className="text-sm font-semibold text-[#5C3A21]">{title}</h3>
      {hint && <span className="text-xs text-[#8A7E70]">{hint}</span>}
    </div>
  )
}

// ============================================================
// Sub-componente: Form Dialog (Crear/Editar) — 4 secciones
// ============================================================
function PlaceFormDialog({
  open,
  mode,
  place,
  onClose,
  onSaved,
}: {
  open: boolean
  mode: FormMode
  place: CmPlaceRecord | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = React.useState<PlaceFormState>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Sincronizar form cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && place) {
        setForm(formFromPlace(place))
      } else {
        setForm(emptyForm())
      }
      setError(null)
    }
  }, [open, mode, place])

  // Helper para actualizar un campo
  const setField = <K extends keyof PlaceFormState>(key: K, value: PlaceFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!form.name.trim()) return setError('El nombre es obligatorio')
    if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      return setError('El email de contacto es inválido')
    }

    setSaving(true)
    try {
      const url = mode === 'create'
        ? '/api/cocina-movil/places'
        : `/api/cocina-movil/places/${place!.id}`
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        contactName: form.contactName.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        // Domicilio
        address: form.address.trim() || null,
        country: form.country.trim() || null,
        province: form.province.trim() || null,
        department: form.department.trim() || null,
        municipality: form.municipality.trim() || null,
        location: form.location,
        // Imagen
        image: form.image || null,
        // Costos
        isOwned: form.isOwned,
        rentCost: form.isOwned ? null : toNumberOrNull(form.rentCost),
        utilityCost: toNumberOrNull(form.utilityCost),
        otherFixedCosts: toNumberOrNull(form.otherFixedCosts),
      }
      if (mode === 'create') {
        body.isActive = true
      } else {
        body.isActive = form.isActive
      }

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)

      toast.success(mode === 'create' ? 'Lugar creado' : 'Lugar actualizado')
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
          <DialogTitle className="text-[#5C3A21]">
            {mode === 'create' ? 'Nuevo Lugar' : 'Editar Lugar'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Creá un nuevo lugar para la Cocina Móvil'
              : place
              ? `Editando «${place.name}»`
              : 'Editar lugar'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* ====== Sección 1: Datos del Lugar ====== */}
          <div className="space-y-3">
            <SectionHeader num={1} title="Datos del Lugar" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 sm:pl-0">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Ej: Cocina Central, Carrito Móvil Centro…"
                  className="border-[#5C3A21]/15"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Descripción</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Breve descripción del lugar, su función, etc."
                  className="border-[#5C3A21]/15 min-h-[72px]"
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Responsable</Label>
                <Input
                  value={form.contactName}
                  onChange={(e) => setField('contactName', e.target.value)}
                  placeholder="Nombre y apellido"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Teléfono</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setField('contactPhone', e.target.value)}
                  placeholder="3754-419324"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Email de contacto</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setField('contactEmail', e.target.value)}
                  placeholder="responsable@ejemplo.com"
                  className="border-[#5C3A21]/15"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#5C3A21]/15" />

          {/* ====== Sección 2: Domicilio ====== */}
          <div className="space-y-3">
            <SectionHeader num={2} title="Domicilio" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 sm:pl-0">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Dirección</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Calle, número, piso, depto…"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">País</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Provincia</Label>
                <Input
                  value={form.province}
                  onChange={(e) => setField('province', e.target.value)}
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Departamento</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setField('department', e.target.value)}
                  placeholder="Capital, Iguazú…"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Municipio</Label>
                <Input
                  value={form.municipality}
                  onChange={(e) => setField('municipality', e.target.value)}
                  placeholder="Posadas, Oberá…"
                  className="border-[#5C3A21]/15"
                />
              </div>
            </div>

            <div className="space-y-1.5 pl-8 sm:pl-0">
              <Label className="text-[#5C3A21]">Ubicación (mapa)</Label>
              <LocationPicker
                location={form.location}
                onLocationChange={(loc) => setField('location', loc)}
              />
            </div>
          </div>

          <Separator className="bg-[#5C3A21]/15" />

          {/* ====== Sección 3: Imagen ====== */}
          <div className="space-y-3">
            <SectionHeader num={3} title="Imagen" />
            <div className="pl-8 sm:pl-0">
              <ImageUploader
                value={form.image}
                onChange={(url) => setField('image', url)}
                uploadUrl="/api/cocina-movil/places/upload-image"
                aspectRatio="4/3"
                label="Imagen del lugar"
                disabled={saving}
              />
            </div>
          </div>

          <Separator className="bg-[#5C3A21]/15" />

          {/* ====== Sección 4: Costos Fijos ====== */}
          <div className="space-y-3">
            <SectionHeader num={4} title="Costos Fijos" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 sm:pl-0">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Tipo de tenencia</Label>
                <div className="flex items-center gap-3 h-9 px-3 border border-[#5C3A21]/15 rounded-md bg-[#FFF8E7]/30">
                  <Home className="h-4 w-4 text-[#5C3A21]" />
                  <Switch
                    checked={form.isOwned}
                    onCheckedChange={(c) => setField('isOwned', c)}
                  />
                  <span className="text-sm text-[#5C3A21]">
                    {form.isOwned ? 'Propio' : 'Alquilado'}
                  </span>
                </div>
              </div>
              {!form.isOwned && (
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Costo de alquiler</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rentCost}
                    onChange={(e) => setField('rentCost', e.target.value)}
                    placeholder="0"
                    className="border-[#5C3A21]/15"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Costo de servicios</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.utilityCost}
                  onChange={(e) => setField('utilityCost', e.target.value)}
                  placeholder="0"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Otros costos fijos</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.otherFixedCosts}
                  onChange={(e) => setField('otherFixedCosts', e.target.value)}
                  placeholder="0"
                  className="border-[#5C3A21]/15"
                />
              </div>
              {mode === 'edit' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[#5C3A21]">Estado</Label>
                  <div className="flex items-center gap-2 h-9 px-3 border border-[#5C3A21]/15 rounded-md bg-[#FFF8E7]/30">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(c) => setField('isActive', c)}
                    />
                    <span className="text-sm text-[#5C3A21]">
                      {form.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-1 px-1 py-2 border-t border-[#5C3A21]/8">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
