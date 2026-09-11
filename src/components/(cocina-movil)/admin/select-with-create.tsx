'use client'

/**
 * ============================================================
 * SelectWithCreate — Cocina Móvil
 * ============================================================
 * Wraps the shadcn Select with a small "+" button that opens a
 * quick-create modal. After saving, the new record is added to
 * the parent's options and auto-selected in the underlying Select.
 *
 * Used in: Compras, Recetas, Producciones, Ventas.
 * ============================================================
 */

import * as React from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// ============================================================
// Types
// ============================================================

export type QuickCreateEntity = 'supplier' | 'place' | 'ingredient' | 'supply' | 'recipe'

export interface SelectOption {
  id: string
  name: string
}

interface EntityConfig {
  label: string
  apiUrl: string
  responseKey: string
  /** Field used for the primary name — recipes use "title", others use "name" */
  nameField: 'name' | 'title'
}

const ENTITY_CONFIG: Record<QuickCreateEntity, EntityConfig> = {
  supplier: { label: 'Proveedor', apiUrl: '/api/cocina-movil/suppliers', responseKey: 'supplier', nameField: 'name' },
  place: { label: 'Lugar', apiUrl: '/api/cocina-movil/places', responseKey: 'place', nameField: 'name' },
  ingredient: { label: 'Materia Prima', apiUrl: '/api/cocina-movil/ingredients', responseKey: 'ingredient', nameField: 'name' },
  supply: { label: 'Insumo', apiUrl: '/api/cocina-movil/supplies', responseKey: 'supply', nameField: 'name' },
  recipe: { label: 'Receta', apiUrl: '/api/cocina-movil/recipes', responseKey: 'recipe', nameField: 'title' },
}

const INGREDIENT_CATEGORIES = [
  { value: 'harinas', label: 'Harinas' },
  { value: 'carnes', label: 'Carnes' },
  { value: 'lacteos', label: 'Lácteos' },
  { value: 'verduras', label: 'Verduras' },
  { value: 'especias', label: 'Especias' },
  { value: 'aceites', label: 'Aceites' },
  { value: 'otros', label: 'Otros' },
]

const SUPPLY_CATEGORIES = [
  { value: 'envases', label: 'Envases' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'descartables', label: 'Descartables' },
  { value: 'otros', label: 'Otros' },
]

const RECIPE_CATEGORIES = [
  { value: 'carnes', label: 'Carnes' },
  { value: 'pastas', label: 'Pastas' },
  { value: 'postres', label: 'Postres' },
  { value: 'aperitivos', label: 'Aperitivos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'otros', label: 'Otros' },
]

// ============================================================
// QuickCreateDialog
// ============================================================

interface QuickCreateDialogProps {
  entity: QuickCreateEntity
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the newly created record (already mapped to {id, name}) */
  onCreated: (record: SelectOption) => void
}

function QuickCreateDialog({ entity, open, onOpenChange, onCreated }: QuickCreateDialogProps) {
  const cfg = ENTITY_CONFIG[entity]
  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState('otros')
  const [contactName, setContactName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [servings, setServings] = React.useState(1)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset all fields whenever the dialog opens
  React.useEffect(() => {
    if (open) {
      setName('')
      setCategory('otros')
      setContactName('')
      setPhone('')
      setAddress('')
      setServings(1)
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError(cfg.nameField === 'title' ? 'El título es obligatorio' : 'El nombre es obligatorio')
      return
    }

    const body: Record<string, unknown> = { [cfg.nameField]: trimmed }
    if (entity === 'supplier') {
      if (contactName.trim()) body.contactName = contactName.trim()
      if (phone.trim()) body.phone = phone.trim()
    } else if (entity === 'place') {
      if (address.trim()) body.address = address.trim()
    } else if (entity === 'ingredient' || entity === 'supply') {
      body.category = category
    } else if (entity === 'recipe') {
      body.category = category
      body.servings = Number(servings) || 1
    }

    setSaving(true)
    try {
      const res = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data && data.error) || 'HTTP ' + res.status)
      const created = data[cfg.responseKey]
      if (!created || !created.id) throw new Error('Respuesta inválida del servidor')
      const record: SelectOption = {
        id: created.id,
        name: created[cfg.nameField] || trimmed,
      }
      toast.success(`${cfg.label} creado: ${record.name}`)
      onCreated(record)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const nameLabel = cfg.nameField === 'title' ? 'Título' : 'Nombre'
  const titleText = `Crear ${cfg.label}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {titleText}
          </DialogTitle>
          <DialogDescription>
            Creá un registro rápido. Podés completar más detalles después desde su módulo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">{nameLabel} *</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Ingresá el ${nameLabel.toLowerCase()}…`}
              className="border-[#5C3A21]/15"
            />
          </div>

          {entity === 'supplier' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Contacto</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nombre del contacto (opcional)" className="border-[#5C3A21]/15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Teléfono</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono (opcional)" className="border-[#5C3A21]/15" />
              </div>
            </>
          )}

          {entity === 'place' && (
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Dirección</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección (opcional)" className="border-[#5C3A21]/15" />
            </div>
          )}

          {(entity === 'ingredient' || entity === 'supply' || entity === 'recipe') && (
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(entity === 'ingredient' ? INGREDIENT_CATEGORIES : entity === 'supply' ? SUPPLY_CATEGORIES : RECIPE_CATEGORIES).map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {entity === 'recipe' && (
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Porciones</Label>
              <Input type="number" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="border-[#5C3A21]/15" />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// SelectWithCreate
// ============================================================

interface SelectWithCreateProps {
  entity: QuickCreateEntity
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  /** Parent callback to add the newly created record to its options state */
  onCreated?: (record: SelectOption) => void
  /** Show a "none" option at the top (for nullable fields like Lugar in Compras) */
  allowNone?: boolean
  noneLabel?: string
  /** Extra classes for the SelectTrigger (e.g. "h-9 text-xs border-...") */
  triggerClassName?: string
  /** Use a smaller + button (h-9) for compact grid rows */
  compact?: boolean
  disabled?: boolean
  /** Accessible label for the + button (defaults to "Crear nuevo <entity>") */
  createLabel?: string
}

function SelectWithCreate({
  entity,
  value,
  onValueChange,
  options,
  placeholder,
  onCreated,
  allowNone = false,
  noneLabel = '— Sin asignar —',
  triggerClassName,
  compact = false,
  disabled = false,
  createLabel,
}: SelectWithCreateProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const cfg = ENTITY_CONFIG[entity]

  const handleCreated = (record: SelectOption) => {
    onCreated?.(record)
    // Defer the auto-select so the parent's options list updates first.
    // Radix Select can't display a value whose option hasn't rendered yet.
    setTimeout(() => onValueChange(record.id), 0)
  }

  const plusTitle = createLabel || `Crear nuevo ${cfg.label.toLowerCase()}`

  return (
    <>
      <div className="flex gap-1.5">
        <Select
          value={value}
          onValueChange={(v) => {
            // Radix Select spuriously calls onValueChange('') when the selected
            // item isn't registered (SelectContent is closed). Ignore those resets
            // so our programmatically-set value survives. Genuine selections are
            // always non-empty (real ids or the '__none__' sentinel).
            if (!v && value && value !== '__none__') return
            onValueChange(v)
          }}
          disabled={disabled}
        >
          <SelectTrigger className={`flex-1 ${triggerClassName || ''}`}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {allowNone && (
              <SelectItem value="__none__">{noneLabel}</SelectItem>
            )}
            {options.length === 0 && !allowNone ? (
              <SelectItem value="__empty__" disabled>No hay registros</SelectItem>
            ) : (
              options.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setCreateOpen(true)}
          disabled={disabled}
          title={plusTitle}
          aria-label={plusTitle}
          className={`shrink-0 border-[#5C3A21]/15 text-[#5C3A21] hover:bg-[#FBF1DC] hover:text-[#5C3A21] ${compact ? 'h-9 w-9' : 'h-9 w-9'}`}
        >
          <Plus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </Button>
      </div>
      <QuickCreateDialog
        entity={entity}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </>
  )
}

export { SelectWithCreate, QuickCreateDialog, ENTITY_CONFIG }
export type { SelectWithCreateProps, QuickCreateDialogProps }
