'use client'

/**
 * ============================================================
 * SelectWithCreate — Cocina Móvil
 * ============================================================
 * Wraps the shadcn Select with a "+" button that opens the FULL
 * creation form for the corresponding entity. After saving, the
 * new record is added to the parent's options and auto-selected.
 *
 * Used in: Compras, Recetas, Producciones, Ventas.
 * ============================================================
 */

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  SupplierFullCreateDialog,
  PlaceFullCreateDialog,
  IngredientFullCreateDialog,
  SupplyFullCreateDialog,
  RecipeFullCreateDialog,
  type CreatedRecord,
} from '@/components/(cocina-movil)/admin/full-create-dialogs'

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
}

const ENTITY_CONFIG: Record<QuickCreateEntity, EntityConfig> = {
  supplier: { label: 'Proveedor' },
  place: { label: 'Lugar' },
  ingredient: { label: 'Materia Prima' },
  supply: { label: 'Insumo' },
  recipe: { label: 'Receta' },
}

// ============================================================
// Full-form render switch
// ============================================================

interface FullFormProps {
  entity: QuickCreateEntity
  open: boolean
  onClose: () => void
  onCreated: (record: CreatedRecord) => void
}

function FullCreateDialog({ entity, open, onClose, onCreated }: FullFormProps) {
  switch (entity) {
    case 'supplier':
      return <SupplierFullCreateDialog open={open} onClose={onClose} onCreated={onCreated} />
    case 'place':
      return <PlaceFullCreateDialog open={open} onClose={onClose} onCreated={onCreated} />
    case 'ingredient':
      return <IngredientFullCreateDialog open={open} onClose={onClose} onCreated={onCreated} />
    case 'supply':
      return <SupplyFullCreateDialog open={open} onClose={onClose} onCreated={onCreated} />
    case 'recipe':
      return <RecipeFullCreateDialog open={open} onClose={onClose} onCreated={onCreated} />
    default:
      return null
  }
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

  const handleCreated = (record: CreatedRecord) => {
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
      <FullCreateDialog
        entity={entity}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(record) => {
          handleCreated(record)
          setCreateOpen(false)
        }}
      />
    </>
  )
}

export { SelectWithCreate, ENTITY_CONFIG }
export type { SelectWithCreateProps }
