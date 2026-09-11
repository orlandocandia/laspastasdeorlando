'use client'

/**
 * ============================================================
 * Full Create Dialogs — Cocina Móvil
 * ============================================================
 * Full-form dialogs for each entity type, used by SelectWithCreate's
 * "+" button. Each dialog replicates ALL fields from the ABM form.
 *
 * Props (uniform across all 5):
 *   { open, onClose, onCreated }
 *   onCreated(record: { id: string; name: string }) called after
 *   successful POST, so the parent can add the record to its options
 *   list and auto-select it.
 * ============================================================
 */

import * as React from 'react'
import { Loader2, Home, Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import ImageUploader from '@/components/(cocina-movil)/admin/image-uploader'
import LocationPicker from '@/components/(cocina-movil)/admin/location-picker'

// ============================================================
// Shared types & helpers
// ============================================================

export interface CreatedRecord {
  id: string
  name: string
}

interface FullCreateDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (record: CreatedRecord) => void
}

const fmtCurrency = (v: number): string => '$' + Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold">{num}</div>
      <h3 className="text-sm font-semibold text-[#5C3A21]">{title}</h3>
    </div>
  )
}

const FormFooter = ({ saving, onClose }: { saving: boolean; onClose: () => void }) => (
  <div className="shrink-0 bg-white border-t border-[#5C3A21]/10 px-6 py-3 flex justify-end gap-2">
    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
    <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      Crear
    </Button>
  </div>
)

// ============================================================
// 1. Supplier Full Form
// ============================================================

export function SupplierFullCreateDialog({ open, onClose, onCreated }: FullCreateDialogProps) {
  const [form, setForm] = React.useState({
    name: '', contactName: '', phone: '', email: '', address: '',
    country: 'Argentina', province: 'Misiones', department: '', municipality: '',
    location: '' as string, image: '' as string,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setForm({
        name: '', contactName: '', phone: '', email: '', address: '',
        country: 'Argentina', province: 'Misiones', department: '', municipality: '',
        location: '', image: '',
      })
      setError(null)
    }
  }, [open])

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
        location: form.location || null, image: form.image || null, isActive: true,
      }
      const res = await fetch('/api/cocina-movil/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success('Proveedor creado')
      onCreated({ id: data.supplier.id, name: data.supplier.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21]">Nuevo Proveedor</DialogTitle>
          <DialogDescription>Agregar proveedor de materias primas o insumos</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden"><div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}

          <SectionHeader num={1} title="Datos del Proveedor" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Nombre *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Razón social" className="border-[#5C3A21]/15" autoFocus /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Contacto</Label><Input value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder="Persona de contacto" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Teléfono</Label><Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="3754-xxxxxx" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Email</Label><Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="email@proveedor.com" className="border-[#5C3A21]/15" /></div>
          </div>

          <Separator />
          <SectionHeader num={2} title="Domicilio" />
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
          <SectionHeader num={3} title="Imagen / Logo" />
          <div className="pl-10">
            <ImageUploader value={form.image || null} onChange={(url) => setField('image', url || '')} uploadUrl="/api/cocina-movil/suppliers/upload-image" label="Logo o foto del proveedor" aspectRatio="4/3" disabled={saving} />
          </div>

          </div><FormFooter saving={saving} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// 2. Place Full Form
// ============================================================

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null
  const n = Number(value)
  return isNaN(n) ? null : n
}

export function PlaceFullCreateDialog({ open, onClose, onCreated }: FullCreateDialogProps) {
  const [form, setForm] = React.useState({
    name: '', description: '', contactName: '', contactPhone: '', contactEmail: '',
    address: '', country: 'Argentina', province: 'Misiones', department: '', municipality: '',
    location: null as string | null, image: null as string | null,
    isOwned: true, rentCost: '', utilityCost: '', otherFixedCosts: '',
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setForm({
        name: '', description: '', contactName: '', contactPhone: '', contactEmail: '',
        address: '', country: 'Argentina', province: 'Misiones', department: '', municipality: '',
        location: null, image: null, isOwned: true, rentCost: '', utilityCost: '', otherFixedCosts: '',
      })
      setError(null)
    }
  }, [open])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('El nombre es obligatorio')
    if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) return setError('El email de contacto es inválido')

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(), description: form.description.trim() || null,
        contactName: form.contactName.trim() || null, contactPhone: form.contactPhone.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        address: form.address.trim() || null, country: form.country.trim() || null,
        province: form.province.trim() || null, department: form.department.trim() || null,
        municipality: form.municipality.trim() || null, location: form.location,
        image: form.image || null, isOwned: form.isOwned,
        rentCost: form.isOwned ? null : toNumberOrNull(form.rentCost),
        utilityCost: toNumberOrNull(form.utilityCost),
        otherFixedCosts: toNumberOrNull(form.otherFixedCosts),
        isActive: true,
      }
      const res = await fetch('/api/cocina-movil/places', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success('Lugar creado')
      onCreated({ id: data.place.id, name: data.place.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21]">Nuevo Lugar</DialogTitle>
          <DialogDescription>Creá un nuevo lugar para la Cocina Móvil</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden"><div className="flex-1 overflow-y-auto px-6 space-y-5 pb-6">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}

          {/* Sección 1: Datos */}
          <SectionHeader num={1} title="Datos del Lugar" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Nombre *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Ej: Cocina Central, Carrito Móvil Centro…" className="border-[#5C3A21]/15" autoFocus /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Descripción</Label><Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Breve descripción del lugar, su función, etc." className="border-[#5C3A21]/15" rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Responsable</Label><Input value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder="Nombre y apellido" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Teléfono</Label><Input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} placeholder="3754-419324" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Email de contacto</Label><Input type="email" value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} placeholder="responsable@ejemplo.com" className="border-[#5C3A21]/15" /></div>
          </div>

          <Separator />
          {/* Sección 2: Domicilio */}
          <SectionHeader num={2} title="Domicilio" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Dirección</Label><Input value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Calle, número, piso, depto…" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">País</Label><Input value={form.country} onChange={(e) => setField('country', e.target.value)} className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Provincia</Label><Input value={form.province} onChange={(e) => setField('province', e.target.value)} className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Departamento</Label><Input value={form.department} onChange={(e) => setField('department', e.target.value)} placeholder="Capital, Iguazú…" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Municipio</Label><Input value={form.municipality} onChange={(e) => setField('municipality', e.target.value)} placeholder="Posadas, Oberá…" className="border-[#5C3A21]/15" /></div>
          </div>
          <div className="pl-10">
            <Label className="text-[#5C3A21] mb-2 block">Ubicación (mapa)</Label>
            <LocationPicker location={form.location} onLocationChange={(loc) => setField('location', loc)} />
          </div>

          <Separator />
          {/* Sección 3: Imagen */}
          <SectionHeader num={3} title="Imagen" />
          <div className="pl-10">
            <ImageUploader value={form.image} onChange={(url) => setField('image', url)} uploadUrl="/api/cocina-movil/places/upload-image" aspectRatio="4/3" label="Imagen del lugar" disabled={saving} />
          </div>

          <Separator />
          {/* Sección 4: Costos Fijos */}
          <SectionHeader num={4} title="Costos Fijos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[#5C3A21]">Tipo de tenencia</Label>
              <div className="flex items-center gap-3 h-9 px-3 border border-[#5C3A21]/15 rounded-md bg-[#FFF8E7]/30">
                <Home className="h-4 w-4 text-[#5C3A21]" />
                <Switch checked={form.isOwned} onCheckedChange={(c) => setField('isOwned', c)} />
                <span className="text-sm text-[#5C3A21]">{form.isOwned ? 'Propio' : 'Alquilado'}</span>
              </div>
            </div>
            {!form.isOwned && (
              <div className="space-y-1.5"><Label className="text-[#5C3A21]">Costo de alquiler</Label><Input type="number" min="0" step="0.01" value={form.rentCost} onChange={(e) => setField('rentCost', e.target.value)} placeholder="0" className="border-[#5C3A21]/15" /></div>
            )}
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Costo de servicios</Label><Input type="number" min="0" step="0.01" value={form.utilityCost} onChange={(e) => setField('utilityCost', e.target.value)} placeholder="0" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Otros costos fijos</Label><Input type="number" min="0" step="0.01" value={form.otherFixedCosts} onChange={(e) => setField('otherFixedCosts', e.target.value)} placeholder="0" className="border-[#5C3A21]/15" /></div>
          </div>

          </div><FormFooter saving={saving} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// 3. Ingredient Full Form
// ============================================================

type CmIngredientCategory = 'harinas' | 'carnes' | 'lacteos' | 'verduras' | 'especias' | 'aceites' | 'otros'

const ING_CATEGORIES: { value: CmIngredientCategory; label: string }[] = [
  { value: 'harinas', label: 'Harinas' }, { value: 'carnes', label: 'Carnes' },
  { value: 'lacteos', label: 'Lácteos' }, { value: 'verduras', label: 'Verduras' },
  { value: 'especias', label: 'Especias' }, { value: 'aceites', label: 'Aceites' },
  { value: 'otros', label: 'Otros' },
]

const ING_PURCHASE_TYPES = [
  { value: 'bulto', label: 'Bulto' }, { value: 'caja', label: 'Caja' },
  { value: 'botella', label: 'Botella' }, { value: 'unidad', label: 'Unidad' },
  { value: 'kg_suelto', label: 'Kg suelto' }, { value: 'litro_suelto', label: 'Litro suelto' },
]

const ING_WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' }, { value: 'g', label: 'g' },
  { value: 'l', label: 'l' }, { value: 'ml', label: 'ml' },
]

function ingGetQuantityLabel(type: string): string {
  switch (type) {
    case 'bulto': return 'Cantidad de Bultos'
    case 'caja': return 'Cantidad de Cajas'
    case 'botella': return 'Cantidad de Botellas'
    case 'unidad': return 'Cantidad de Unidades'
    case 'kg_suelto': return 'Cantidad de Kg'
    case 'litro_suelto': return 'Cantidad de Litros'
    default: return 'Cantidad de Unidades'
  }
}

function ingGetWeightLabel(type: string): string {
  switch (type) {
    case 'bulto': return 'Peso por Bulto (kg)'
    case 'caja': return 'Peso por Caja (kg)'
    case 'botella': return 'Volumen por Botella (l)'
    case 'unidad': return 'Peso por Unidad (g)'
    default: return 'Peso/Volumen por Unidad'
  }
}

function ingIsWeightFieldHidden(type: string): boolean {
  return type === 'kg_suelto' || type === 'litro_suelto'
}

function ingGetDefaultWeightUnit(type: string): string {
  switch (type) {
    case 'bulto': return 'kg'
    case 'caja': return 'kg'
    case 'botella': return 'l'
    case 'unidad': return 'g'
    case 'kg_suelto': return 'kg'
    case 'litro_suelto': return 'l'
    default: return 'kg'
  }
}

export function IngredientFullCreateDialog({ open, onClose, onCreated }: FullCreateDialogProps) {
  const [form, setForm] = React.useState({
    name: '', description: '', category: '' as string,
    purchaseUnitType: '' as string, unitsPurchased: '', weightPerUnit: '',
    weightUnit: 'kg' as string, totalPrice: '', image: '' as string,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setForm({ name: '', description: '', category: '', purchaseUnitType: '', unitsPurchased: '', weightPerUnit: '', weightUnit: 'kg', totalPrice: '', image: '' })
      setError(null)
    }
  }, [open])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('El nombre es obligatorio')
    const tp = parseFloat(form.totalPrice)
    if (form.totalPrice && (isNaN(tp) || tp < 0)) return setError('El precio total debe ser un número válido')

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name, description: form.description || null,
        category: form.category || null, purchaseUnit: 'kg',
        purchaseUnitType: form.purchaseUnitType || null,
        unitsPurchased: form.unitsPurchased ? parseFloat(form.unitsPurchased) : null,
        weightPerUnit: form.weightPerUnit ? parseFloat(form.weightPerUnit) : null,
        weightUnit: form.weightUnit || null,
        totalPrice: form.totalPrice ? parseFloat(form.totalPrice) : null,
        image: form.image || null, isActive: true,
      }
      const res = await fetch('/api/cocina-movil/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success('Materia prima creada')
      onCreated({ id: data.ingredient.id, name: data.ingredient.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21]">Nueva Materia Prima</DialogTitle>
          <DialogDescription>Agregar ingrediente para recetas y producción</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden"><div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}

          <SectionHeader num={1} title="Datos de la Materia Prima" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Nombre *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} className="border-[#5C3A21]/15" autoFocus /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Categoría</Label><Select value={form.category || 'none'} onValueChange={(v) => setField('category', v === 'none' ? '' : v)}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Sin categoría" /></SelectTrigger><SelectContent><SelectItem value="none">— Sin categoría —</SelectItem>{ING_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Descripción</Label><Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="border-[#5C3A21]/15" rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Tipo de Unidad de Compra</Label><Select value={form.purchaseUnitType || 'none'} onValueChange={(v) => {
              const nt = v === 'none' ? '' : v
              setField('purchaseUnitType', nt)
              if (nt) setField('weightUnit', ingGetDefaultWeightUnit(nt))
              if (ingIsWeightFieldHidden(nt)) setField('weightPerUnit', '1')
            }}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Sin tipo" /></SelectTrigger><SelectContent><SelectItem value="none">— Sin tipo —</SelectItem>{ING_PURCHASE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">{ingGetQuantityLabel(form.purchaseUnitType)}</Label><Input type="number" step="0.01" min="0" value={form.unitsPurchased} onChange={(e) => setField('unitsPurchased', e.target.value)} placeholder={form.purchaseUnitType === 'kg_suelto' ? 'ej: 5 (5 kg sueltos)' : form.purchaseUnitType === 'litro_suelto' ? 'ej: 3 (3 litros sueltos)' : 'ej: 1 (bulto), 6 (botellas)'} className="border-[#5C3A21]/15" /></div>
            {!ingIsWeightFieldHidden(form.purchaseUnitType) && (
              <div className="space-y-1.5 grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label className="text-[#5C3A21]">{ingGetWeightLabel(form.purchaseUnitType)}</Label><Input type="number" step="0.01" min="0" value={form.weightPerUnit} onChange={(e) => setField('weightPerUnit', e.target.value)} placeholder="ej: 25" className="border-[#5C3A21]/15" /></div>
                <div className="space-y-1.5"><Label className="text-[#5C3A21]">Unidad</Label><Select value={form.weightUnit} onValueChange={(v) => setField('weightUnit', v)}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger><SelectContent>{ING_WEIGHT_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
            )}
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Precio Total Pagado ($)</Label><Input type="number" step="0.01" min="0" value={form.totalPrice} onChange={(e) => setField('totalPrice', e.target.value)} placeholder="ej: 450" className="border-[#5C3A21]/15" /></div>
            {form.unitsPurchased && form.totalPrice && parseFloat(form.unitsPurchased) > 0 && parseFloat(form.totalPrice) > 0 && (
              <div className="bg-[#E1AD01]/10 border border-[#E1AD01]/30 rounded-md p-3 space-y-1">
                <p className="text-xs font-semibold text-[#7a5c00]">📊 Cálculo automático:</p>
                {(() => {
                  const qty = parseFloat(form.unitsPurchased)
                  const wpu = ingIsWeightFieldHidden(form.purchaseUnitType) ? 1 : (form.weightPerUnit ? parseFloat(form.weightPerUnit) : 0)
                  const wu = form.weightUnit || 'kg'
                  const total = qty * wpu
                  const pricePerUnit = total > 0 ? parseFloat(form.totalPrice) / total : 0
                  const totalGrams = wu === 'kg' ? total * 1000 : wu === 'l' ? total * 1000 : wu === 'g' ? total : total
                  return (<>
                    <p className="text-sm text-[#5C3A21]">Precio por {wu}: <strong>{fmtCurrency(pricePerUnit)}</strong></p>
                    <p className="text-sm text-[#5C3A21]">Total: <strong>{total.toLocaleString('es-AR')} {wu}</strong> ({totalGrams.toLocaleString('es-AR')} g)</p>
                  </>)
                })()}
              </div>
            )}
          </div>

          <Separator />
          <SectionHeader num={2} title="Imagen" />
          <div className="pl-10">
            <ImageUploader value={form.image || null} onChange={(url) => setField('image', url || '')} uploadUrl="/api/cocina-movil/ingredients/upload-image" label="Imagen de la materia prima" aspectRatio="4/3" disabled={saving} />
          </div>

          </div><FormFooter saving={saving} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// 4. Supply Full Form
// ============================================================

type CmSupplyCategory = 'envases' | 'limpieza' | 'descartables' | 'otros'

const SUP_CATEGORIES: { value: CmSupplyCategory; label: string }[] = [
  { value: 'envases', label: 'Envases' }, { value: 'limpieza', label: 'Limpieza' },
  { value: 'descartables', label: 'Descartables' }, { value: 'otros', label: 'Otros' },
]

const SUP_PURCHASE_TYPES = [
  { value: 'unidad', label: 'Unidad' }, { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' }, { value: 'rollo', label: 'Rollo' },
  { value: 'kg_suelto', label: 'Kg suelto' }, { value: 'metro_suelto', label: 'Metro suelto' },
]

const SUP_MEASURE_UNITS = [
  { value: 'u', label: 'unidades' }, { value: 'm', label: 'metros' },
  { value: 'kg', label: 'kg' }, { value: 'cm', label: 'cm' }, { value: 'g', label: 'g' },
]

function supGetQuantityLabel(type: string): string {
  switch (type) {
    case 'unidad': return 'Cantidad de Unidades'
    case 'caja': return 'Cantidad de Cajas'
    case 'paquete': return 'Cantidad de Paquetes'
    case 'rollo': return 'Cantidad de Rollos'
    case 'kg_suelto': return 'Cantidad de Kg'
    case 'metro_suelto': return 'Cantidad de Metros'
    default: return 'Cantidad'
  }
}

function supGetMeasureLabel(type: string): string {
  switch (type) {
    case 'caja': return 'Unidades por Caja'
    case 'paquete': return 'Unidades por Paquete'
    case 'rollo': return 'Metros por Rollo'
    default: return 'Medida por Unidad'
  }
}

function supIsMeasureFieldHidden(type: string): boolean {
  return type === 'unidad' || type === 'kg_suelto' || type === 'metro_suelto'
}

function supGetAutoUsageUnit(type: string): string {
  switch (type) {
    case 'unidad': return 'u'
    case 'caja': return 'u'
    case 'paquete': return 'u'
    case 'rollo': return 'cm'
    case 'kg_suelto': return 'g'
    case 'metro_suelto': return 'cm'
    default: return 'u'
  }
}

export function SupplyFullCreateDialog({ open, onClose, onCreated }: FullCreateDialogProps) {
  const [form, setForm] = React.useState({
    name: '', description: '', category: '' as string,
    purchaseUnitType: '' as string, unitsPurchased: '', measurePerUnit: '',
    measureUnit: 'u' as string, totalPrice: '', image: '' as string,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setForm({ name: '', description: '', category: '', purchaseUnitType: '', unitsPurchased: '', measurePerUnit: '', measureUnit: 'u', totalPrice: '', image: '' })
      setError(null)
    }
  }, [open])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('El nombre es obligatorio')
    const tp = parseFloat(form.totalPrice)
    if (form.totalPrice && (isNaN(tp) || tp < 0)) return setError('El precio total debe ser un número válido')

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name, description: form.description || null,
        category: form.category || null, purchaseUnit: 'u',
        purchaseUnitType: form.purchaseUnitType || null,
        unitsPurchased: form.unitsPurchased ? parseFloat(form.unitsPurchased) : null,
        measurePerUnit: form.measurePerUnit ? parseFloat(form.measurePerUnit) : null,
        measureUnit: form.measureUnit || null,
        totalPrice: form.totalPrice ? parseFloat(form.totalPrice) : null,
        usageUnit: supGetAutoUsageUnit(form.purchaseUnitType),
        image: form.image || null, isActive: true,
      }
      const res = await fetch('/api/cocina-movil/supplies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success('Insumo creado')
      onCreated({ id: data.supply.id, name: data.supply.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21]">Nuevo Insumo</DialogTitle>
          <DialogDescription>Agregar material no comestible para la operación</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden"><div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}

          <SectionHeader num={1} title="Datos del Insumo" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Nombre *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} className="border-[#5C3A21]/15 h-10" autoFocus /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Categoría</Label><Select value={form.category || 'none'} onValueChange={(v) => setField('category', v === 'none' ? '' : v)}><SelectTrigger className="border-[#5C3A21]/15 h-10"><SelectValue placeholder="Sin categoría" /></SelectTrigger><SelectContent><SelectItem value="none">— Sin categoría —</SelectItem>{SUP_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Descripción</Label><Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="border-[#5C3A21]/15" rows={2} /></div>
          </div>

          <Separator />
          <SectionHeader num={2} title="Compra" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Tipo de Unidad de Compra</Label><Select value={form.purchaseUnitType || 'none'} onValueChange={(v) => { const nt = v === 'none' ? '' : v; setField('purchaseUnitType', nt); if (supIsMeasureFieldHidden(nt)) setField('measurePerUnit', '1') }}><SelectTrigger className="border-[#5C3A21]/15 h-10"><SelectValue placeholder="Sin tipo" /></SelectTrigger><SelectContent><SelectItem value="none">— Sin tipo —</SelectItem>{SUP_PURCHASE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">{supGetQuantityLabel(form.purchaseUnitType)}</Label><Input type="number" step="0.01" min="0" value={form.unitsPurchased} onChange={(e) => setField('unitsPurchased', e.target.value)} placeholder="ej: 1 (caja), 6 (rollos)" className="border-[#5C3A21]/15 h-10" /></div>
            {!supIsMeasureFieldHidden(form.purchaseUnitType) && (
              <>
                <div className="space-y-1.5"><Label className="text-[#5C3A21]">{supGetMeasureLabel(form.purchaseUnitType)}</Label><Input type="number" step="0.01" min="0" value={form.measurePerUnit} onChange={(e) => setField('measurePerUnit', e.target.value)} placeholder="ej: 100" className="border-[#5C3A21]/15 h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[#5C3A21]">Unidad de Medida</Label><Select value={form.measureUnit} onValueChange={(v) => setField('measureUnit', v)}><SelectTrigger className="border-[#5C3A21]/15 h-10"><SelectValue /></SelectTrigger><SelectContent>{SUP_MEASURE_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select></div>
              </>
            )}
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Precio Total Pagado ($)</Label><Input type="number" step="0.01" min="0" value={form.totalPrice} onChange={(e) => setField('totalPrice', e.target.value)} placeholder="ej: 2500" className="border-[#5C3A21]/15 h-10" /></div>
            {form.unitsPurchased && form.totalPrice && parseFloat(form.unitsPurchased) > 0 && parseFloat(form.totalPrice) > 0 && (
              <div className="sm:col-span-2 bg-[#E1AD01]/10 border border-[#E1AD01]/30 rounded-md p-3 space-y-1">
                <p className="text-xs font-semibold text-[#7a5c00]">📊 Cálculo automático:</p>
                {(() => {
                  const qty = parseFloat(form.unitsPurchased)
                  const total = parseFloat(form.totalPrice)
                  const measure = form.measurePerUnit && !supIsMeasureFieldHidden(form.purchaseUnitType) ? parseFloat(form.measurePerUnit) : 1
                  const pType = form.purchaseUnitType
                  const usageUnit = supGetAutoUsageUnit(pType)
                  const pricePerPurchase = total / (qty * measure)
                  let pricePerUsage: number | null = null
                  let purchaseUnitLabel = ''
                  let usageUnitLabel = ''
                  if (pType === 'rollo' || pType === 'metro_suelto') { pricePerUsage = pricePerPurchase / 100; purchaseUnitLabel = '/m'; usageUnitLabel = '/cm' }
                  else if (pType === 'kg_suelto') { pricePerUsage = pricePerPurchase / 1000; purchaseUnitLabel = '/kg'; usageUnitLabel = '/g' }
                  else { pricePerUsage = pricePerPurchase; purchaseUnitLabel = '/u'; usageUnitLabel = '/u' }
                  return (<>
                    <p className="text-sm text-[#5C3A21]">Precio por unidad de compra: <strong>{fmtCurrency(pricePerPurchase)}{purchaseUnitLabel}</strong></p>
                    <p className="text-sm text-[#5C3A21]">Precio por unidad de uso ({usageUnit === 'u' ? 'Unidades' : usageUnit === 'g' ? 'Gramos' : 'Centímetros'}): <strong>{fmtCurrency(pricePerUsage)}{usageUnitLabel}</strong></p>
                  </>)
                })()}
              </div>
            )}
          </div>

          <Separator />
          <SectionHeader num={3} title="Imagen" />
          <div className="pl-10">
            <ImageUploader value={form.image || null} onChange={(url) => setField('image', url || '')} uploadUrl="/api/cocina-movil/supplies/upload-image" label="Imagen del insumo" aspectRatio="4/3" disabled={saving} />
          </div>

          </div><FormFooter saving={saving} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// 5. Recipe Full Form
// ============================================================

type CmRecipeCategory = 'carnes' | 'pastas' | 'postres' | 'aperitivos' | 'bebidas' | 'otros'
type CmRecipeDifficulty = 'facil' | 'media' | 'dificil'

const REC_CATEGORIES: { value: CmRecipeCategory; label: string }[] = [
  { value: 'carnes', label: 'Carnes' }, { value: 'pastas', label: 'Pastas' },
  { value: 'postres', label: 'Postres' }, { value: 'aperitivos', label: 'Aperitivos' },
  { value: 'bebidas', label: 'Bebidas' }, { value: 'otros', label: 'Otros' },
]

const DIFFICULTIES: { value: CmRecipeDifficulty; label: string }[] = [
  { value: 'facil', label: 'Fácil' }, { value: 'media', label: 'Media' }, { value: 'dificil', label: 'Difícil' },
]

interface RecipeRowItem {
  key: string
  itemId: string
  name: string
  quantity: number
  unit: string
  pricePerUnit: number
}

const newItemKey = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `item-${crypto.randomUUID()}`
    : `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function RecipeFullCreateDialog({ open, onClose, onCreated }: FullCreateDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [category, setCategory] = React.useState<CmRecipeCategory | ''>('')
  const [preparationTime, setPreparationTime] = React.useState('')
  const [cookingTime, setCookingTime] = React.useState('')
  const [difficulty, setDifficulty] = React.useState<CmRecipeDifficulty | '__none__'>('__none__')
  const [servings, setServings] = React.useState('1')
  const [steps, setSteps] = React.useState('')
  const [image, setImage] = React.useState('')
  const [ingItems, setIngItems] = React.useState<RecipeRowItem[]>([])
  const [supItems, setSupItems] = React.useState<RecipeRowItem[]>([])
  const [ingredients, setIngredients] = React.useState<{ id: string; name: string; purchaseUnit: string; purchasePrice: number }[]>([])
  const [supplies, setSupplies] = React.useState<{ id: string; name: string; purchaseUnit: string; purchasePrice: number }[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setTitle(''); setDescription(''); setCategory(''); setPreparationTime(''); setCookingTime('')
      setDifficulty('__none__'); setServings('1'); setSteps(''); setImage('')
      setIngItems([]); setSupItems([]); setError(null)
      // Fetch ingredients & supplies for the dropdowns
      Promise.all([
        fetch('/api/cocina-movil/ingredients?isActive=true').then((r) => r.json().catch(() => ({}))),
        fetch('/api/cocina-movil/supplies?isActive=true').then((r) => r.json().catch(() => ({}))),
      ]).then(([iData, sData]) => {
        setIngredients((iData.ingredients || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({ id: x.id, name: x.name, purchaseUnit: x.purchaseUnit, purchasePrice: x.purchasePrice })))
        setSupplies((sData.supplies || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({ id: x.id, name: x.name, purchaseUnit: x.purchaseUnit, purchasePrice: x.purchasePrice })))
      }).catch(() => {})
    }
  }, [open])

  const ingredientsCost = ingItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0)
  const suppliesCost = supItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0)
  const totalCost = ingredientsCost + suppliesCost
  const servingsNum = Number(servings) || 0
  const costPerServing = servingsNum > 0 ? totalCost / servingsNum : 0

  const addIng = () => setIngItems((arr) => [...arr, { key: newItemKey(), itemId: '', name: '', quantity: 1, unit: '', pricePerUnit: 0 }])
  const removeIng = (key: string) => setIngItems((arr) => arr.filter((it) => it.key !== key))
  const updateIng = (key: string, patch: Partial<RecipeRowItem>) => setIngItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const onIngSelect = (key: string, id: string) => {
    const prod = ingredients.find((p) => p.id === id)
    updateIng(key, { itemId: id, name: prod?.name || '', unit: prod?.purchaseUnit || '', pricePerUnit: prod?.purchasePrice || 0 })
  }

  const addSup = () => setSupItems((arr) => [...arr, { key: newItemKey(), itemId: '', name: '', quantity: 1, unit: '', pricePerUnit: 0 }])
  const removeSup = (key: string) => setSupItems((arr) => arr.filter((it) => it.key !== key))
  const updateSup = (key: string, patch: Partial<RecipeRowItem>) => setSupItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const onSupSelect = (key: string, id: string) => {
    const prod = supplies.find((p) => p.id === id)
    updateSup(key, { itemId: id, name: prod?.name || '', unit: prod?.purchaseUnit || '', pricePerUnit: prod?.purchasePrice || 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) return setError('El título es obligatorio')
    if (!category) return setError('La categoría es obligatoria')
    const serv = Number(servings)
    if (!serv || serv <= 0) return setError('Las porciones deben ser mayores a 0')

    const validIng = ingItems.filter((it) => it.itemId && Number(it.quantity) > 0).map((it) => ({ ingredientId: it.itemId, quantity: Number(it.quantity), unit: it.unit || 'u' }))
    const validSup = supItems.filter((it) => it.itemId && Number(it.quantity) > 0).map((it) => ({ supplyId: it.itemId, quantity: Number(it.quantity), unit: it.unit || 'u' }))

    setSaving(true)
    try {
      const body = {
        title: title.trim(), description: description.trim() || null, category,
        preparationTime: preparationTime.trim() || null, cookingTime: cookingTime.trim() || null,
        difficulty: difficulty === '__none__' ? null : difficulty, servings: serv,
        steps: steps.trim() || null, image: image || null, cookId: null,
        ingredients: validIng, supplies: validSup, isActive: true,
      }
      const res = await fetch('/api/cocina-movil/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success('Receta creada')
      onCreated({ id: data.recipe.id, name: data.recipe.title })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const RowUI = ({ it, pool, onSelect, onUpdate, onRemove, typeLabel }: {
    it: RecipeRowItem
    pool: { id: string; name: string; purchaseUnit: string; purchasePrice: number }[]
    onSelect: (key: string, id: string) => void
    onUpdate: (key: string, patch: Partial<RecipeRowItem>) => void
    onRemove: (key: string) => void
    typeLabel: string
  }) => (
    <div className="grid grid-cols-12 gap-2 p-2 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
      <div className="col-span-5">
        <Select value={it.itemId} onValueChange={(v) => onSelect(it.key, v)}>
          <SelectTrigger className="h-9 border-[#5C3A21]/15 text-xs"><SelectValue placeholder={`Seleccionar ${typeLabel}…`} /></SelectTrigger>
          <SelectContent>
            {pool.length === 0 ? <SelectItem value="__empty__" disabled>No hay {typeLabel}s</SelectItem> : pool.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2"><Input type="number" min="0" step="any" value={it.quantity} onChange={(e) => onUpdate(it.key, { quantity: Number(e.target.value) })} className="h-9 border-[#5C3A21]/15 text-xs text-right" /></div>
      <div className="col-span-2"><Input value={it.unit} onChange={(e) => onUpdate(it.key, { unit: e.target.value })} placeholder="u" className="h-9 border-[#5C3A21]/15 text-xs" /></div>
      <div className="col-span-2 text-right text-xs font-medium text-[#5C3A21] flex items-center justify-end">{fmtCurrency((Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0))}</div>
      <div className="col-span-1 flex items-center justify-center"><Button type="button" size="icon" variant="ghost" onClick={() => onRemove(it.key)} className="h-8 w-8 text-[#B91C1C] hover:bg-[#B91C1C]/10"><X className="h-4 w-4" /></Button></div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[#5C3A21]">Nueva Receta</DialogTitle>
          <DialogDescription>Crear una receta con ingredientes, insumos y cálculo de costos</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden"><div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}

          <SectionHeader num={1} title="Datos de la Receta" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="border-[#5C3A21]/15" autoFocus /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Categoría *</Label><Select value={category || 'none'} onValueChange={(v) => setCategory(v === 'none' ? '' : v as CmRecipeCategory)}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Sin categoría" /></SelectTrigger><SelectContent><SelectItem value="none">— Sin categoría —</SelectItem>{REC_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border-[#5C3A21]/15" rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Dificultad</Label><Select value={difficulty} onValueChange={(v) => setDifficulty(v as CmRecipeDifficulty | '__none__')}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Sin especificar" /></SelectTrigger><SelectContent><SelectItem value="__none__">— Sin especificar —</SelectItem>{DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Porciones *</Label><Input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Tiempo de Preparación</Label><Input value={preparationTime} onChange={(e) => setPreparationTime(e.target.value)} placeholder="ej: 30 min" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5"><Label className="text-[#5C3A21]">Tiempo de Cocción</Label><Input value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} placeholder="ej: 45 min" className="border-[#5C3A21]/15" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Pasos</Label><Textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Pasos de la receta…" className="border-[#5C3A21]/15" rows={3} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-[#5C3A21]">Imagen</Label><ImageUploader value={image || null} onChange={(url) => setImage(url || '')} uploadUrl="/api/cocina-movil/recipes/upload-image" label="Imagen de la receta" aspectRatio="4/3" disabled={saving} /></div>
          </div>

          <Separator />
          <SectionHeader num={2} title="Ingredientes (Materias Primas)" />
          <div className="pl-10 space-y-2">
            <Button type="button" size="sm" variant="outline" onClick={addIng} className="border-[#5C3A21]/20 text-[#5C3A21]"><Plus className="h-3.5 w-3.5" />Agregar Ingrediente</Button>
            <div className="hidden lg:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-[#8A7E70]">
              <div className="col-span-5">Producto</div><div className="col-span-2 text-right">Cant.</div><div className="col-span-2">Unidad</div><div className="col-span-2 text-right">Subtotal</div><div className="col-span-1" />
            </div>
            {ingItems.map((it) => <RowUI key={it.key} it={it} pool={ingredients} onSelect={onIngSelect} onUpdate={updateIng} onRemove={removeIng} typeLabel="materia prima" />)}
            {ingItems.length > 0 && <div className="text-right text-sm text-[#5C3A21]">Costo ingredientes: <strong>{fmtCurrency(ingredientsCost)}</strong></div>}
          </div>

          <Separator />
          <SectionHeader num={3} title="Insumos" />
          <div className="pl-10 space-y-2">
            <Button type="button" size="sm" variant="outline" onClick={addSup} className="border-[#5C3A21]/20 text-[#5C3A21]"><Plus className="h-3.5 w-3.5" />Agregar Insumo</Button>
            <div className="hidden lg:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-[#8A7E70]">
              <div className="col-span-5">Producto</div><div className="col-span-2 text-right">Cant.</div><div className="col-span-2">Unidad</div><div className="col-span-2 text-right">Subtotal</div><div className="col-span-1" />
            </div>
            {supItems.map((it) => <RowUI key={it.key} it={it} pool={supplies} onSelect={onSupSelect} onUpdate={updateSup} onRemove={removeSup} typeLabel="insumo" />)}
            {supItems.length > 0 && <div className="text-right text-sm text-[#5C3A21]">Costo insumos: <strong>{fmtCurrency(suppliesCost)}</strong></div>}
          </div>

          <Separator />
          <SectionHeader num={4} title="Costos" />
          <div className="pl-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FBF1DC] rounded-md p-3 text-center"><p className="text-xs text-[#8A7E70]">Costo Total</p><p className="text-lg font-bold text-[#5C3A21]">{fmtCurrency(totalCost)}</p></div>
            <div className="bg-[#708238]/10 rounded-md p-3 text-center"><p className="text-xs text-[#8A7E70]">Costo por Porción</p><p className="text-lg font-bold text-[#708238]">{fmtCurrency(costPerServing)}</p></div>
            <div className="bg-[#FFF8E7] rounded-md p-3 text-center"><p className="text-xs text-[#8A7E70]">Porciones</p><p className="text-lg font-bold text-[#5C3A21]">{servingsNum}</p></div>
          </div>

          </div><FormFooter saving={saving} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
