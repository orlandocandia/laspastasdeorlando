'use client'

/**
 * ============================================================
 * Cocinero — Mis Recetas (READ-ONLY)
 * ============================================================
 * URL: /cm/cocina/recetas
 *
 * Vista de solo lectura para el rol Cocinero.
 * - Lista de recetas con búsqueda + filtro por categoría
 * - Cada receta: título, categoría, porciones, costo/porción,
 *   costo total
 * - Botón "Nueva Receta" → /cm/admin/recetas?action=new
 * - Botones de exportación (Imprimir / PDF / Word / Excel)
 * - Acción "Editar" → /cm/admin/recetas (vista admin)
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import {
  ChefHat, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Loader2, Plus, Pencil,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ============================================================
// Tipos (mínimos necesarios para renderizar la lista)
// ============================================================

interface CmRecipeListItem {
  id: string
  title: string
  category: string
  servings: number
  totalCost: number
  costPerServing: number
  isActive: boolean
  createdAt: number
}

// ============================================================
// Constantes
// ============================================================

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'pastas', label: 'Pastas' },
  { value: 'salsas', label: 'Salsas' },
  { value: 'guisos_estofados', label: 'Guisos y Estofados' },
  { value: 'sopas_cremas', label: 'Sopas y Cremas' },
  { value: 'horneados', label: 'Horneados' },
  { value: 'postres', label: 'Postres' },
  { value: 'acompanamientos', label: 'Acompañamientos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'otros', label: 'Otros' },
]

function CATEGORY_LABEL(cat: string): string {
  const found = CATEGORIES.find((c) => c.value === cat)
  return found ? found.label : cat
}

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (v: number) =>
  `$${Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

// ============================================================
// Página
// ============================================================

export default function CookRecetasPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
          <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
        </div>
      }
    >
      <CookRecetasPageContent />
    </React.Suspense>
  )
}

function CookRecetasPageContent() {
  const [recipes, setRecipes] = React.useState<CmRecipeListItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [catFilter, setCatFilter] = React.useState<string>('all')
  const [formOpen, setFormOpen] = React.useState(false)

  const loadRecipes = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (catFilter !== 'all') params.set('category', catFilter)
      params.set('isActive', 'true')
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/recipes?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setRecipes(data.recipes || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar recetas')
    } finally {
      setLoading(false)
    }
  }, [search, catFilter])

  React.useEffect(() => {
    const id = setTimeout(loadRecipes, 250)
    return () => clearTimeout(id)
  }, [loadRecipes])

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (catFilter !== 'all') params.set('category', catFilter)
    params.set('isActive', 'true')
    window.open(`/api/cocina-movil/recipes/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <ChefHat className="h-6 w-6" />Mis Recetas
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nueva Receta
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por título o descripción…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-full lg:w-48 border-[#5C3A21]/15">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
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
          ) : recipes.length === 0 ? (
            <div className="py-16 text-center">
              <ChefHat className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron recetas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Receta</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="text-center">Porciones</TableHead>
                    <TableHead className="text-right">Costo/porción</TableHead>
                    <TableHead className="text-right">Costo total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((r, i) => (
                    <TableRow key={r.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[#5C3A21]">{r.title}</p>
                        {r.servings > 0 && (
                          <p className="text-xs text-[#8A7E70] md:hidden">
                            {r.servings} porciones · {CATEGORY_LABEL(r.category)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px] border-[#5C3A21]/20 text-[#5C3A21]">
                          {CATEGORY_LABEL(r.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-[#4A3F36]">
                        {r.servings} <span className="text-xs text-[#8A7E70]">porc.</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-[#4A3F36] whitespace-nowrap">
                        {fmtCurrency(r.costPerServing)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">
                        {fmtCurrency(r.totalCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline" className="h-8 border-[#5C3A21]/20 text-[#5C3A21]">
                          <Link href="/cm/cocina/recetas">
                            <Pencil className="h-3.5 w-3.5" />Ver
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple creation dialog */}
      <SimpleRecipeDialog open={formOpen} onClose={() => setFormOpen(false)} onCreated={loadRecipes} />
    </div>
  )
}

function SimpleRecipeDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState('otros')
  const [servings, setServings] = React.useState('1')
  const [description, setDescription] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => { if (open) { setTitle(''); setCategory('otros'); setServings('1'); setDescription(''); setError(null) } }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('El título es obligatorio')
    setSaving(true)
    try {
      const res = await fetch('/api/cocina-movil/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, category, servings: Number(servings) || 1, description: description.trim() || null }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success('Receta creada')
      onCreated()
      onClose()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[#5C3A21]">Nueva Receta</DialogTitle><DialogDescription>Creá una receta básica. Podés completar más detalles desde el panel Admin.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>}
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="border-[#5C3A21]/15" autoFocus /></div>
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Porciones</Label><Input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} className="border-[#5C3A21]/15" /></div>
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="border-[#5C3A21]/15 resize-none" /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">{saving ? 'Guardando…' : 'Crear'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
