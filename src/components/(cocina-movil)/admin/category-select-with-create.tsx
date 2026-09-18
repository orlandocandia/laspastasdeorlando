'use client'

/**
 * ============================================================
 * CategorySelectWithCreate — Cocina Móvil
 * ============================================================
 * A Select for recipe categories with a "+" button that opens a
 * small dialog to create a new custom category. The new category
 * is added to the local options list and auto-selected.
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

export interface CategoryOption {
  value: string
  label: string
}

interface CategorySelectWithCreateProps {
  value: string
  onValueChange: (value: string) => void
  options: CategoryOption[]
  placeholder?: string
  /** Callback when a new category is created (parent can persist if needed) */
  onCategoryCreated?: (category: { value: string; label: string }) => void
}

export function CategorySelectWithCreate({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccionar categoría…',
  onCategoryCreated,
}: CategorySelectWithCreateProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const openCreate = () => {
    setNewCategoryName('')
    setError(null)
    setCreateOpen(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      setError('El nombre de la categoría es obligatorio')
      return
    }
    // Check for duplicates (case-insensitive)
    const exists = options.some(
      (o) => o.label.toLowerCase() === trimmed.toLowerCase() || o.value.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      setError('Ya existe una categoría con ese nombre')
      return
    }

    setSaving(true)
    // Generate a slug-like value from the label
    const slug = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    const newCat = { value: slug || `cat_${Date.now()}`, label: trimmed }

    setTimeout(() => {
      onCategoryCreated?.(newCat)
      onValueChange(newCat.value)
      toast.success(`Categoría creada: ${newCat.label}`)
      setSaving(false)
      setCreateOpen(false)
    }, 100)
  }

  const currentLabel = options.find((o) => o.value === value)?.label || value || ''

  return (
    <>
      <div className="flex gap-1.5">
        <Select
          value={value}
          onValueChange={(v) => {
            // Guard against Radix spurious empty resets
            if (!v && value) return
            onValueChange(v)
          }}
        >
          <SelectTrigger className="flex-1 border-[#5C3A21]/15">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 ? (
              <SelectItem value="__empty__" disabled>No hay categorías</SelectItem>
            ) : (
              options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={openCreate}
          title="Crear nueva categoría"
          aria-label="Crear nueva categoría"
          className="shrink-0 border-[#5C3A21]/15 text-[#5C3A21] hover:bg-[#FBF1DC] hover:text-[#5C3A21] h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21] flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Categoría
            </DialogTitle>
            <DialogDescription>
              Creá una categoría personalizada para tus recetas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            {error && (
              <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Nombre de la categoría *</Label>
              <Input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Empanadas, Minutas, etc."
                className="border-[#5C3A21]/15"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
