'use client'

/**
 * ============================================================
 * Recetas — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/recetas
 * ABM completo con formulario de 4 secciones:
 *   1) Datos de la Receta
 *   2) Ingredientes (Materias Primas)
 *   3) Insumos
 *   4) Costos (auto-calculados)
 * Cálculo de costos dinámico en tiempo real.
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Pencil, Trash2, MoreHorizontal, Loader2, X,
  ChefHat, Package, FlaskConical, Calculator,
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import ImageUploader from '@/components/(cocina-movil)/admin/image-uploader'

// ============================================================
// Tipos
// ============================================================

type CmRecipeCategory = 'carnes' | 'pastas' | 'postres' | 'aperitivos' | 'bebidas' | 'otros'
type CmRecipeDifficulty = 'facil' | 'media' | 'dificil'

interface CmRecipeIngredient {
  id: string
  recipeId: string
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  cost: number
}

interface CmRecipeSupply {
  id: string
  recipeId: string
  supplyId: string
  supplyName: string
  quantity: number
  unit: string
  cost: number
}

interface CmRecipeRecord {
  id: string
  title: string
  description: string | null
  category: CmRecipeCategory
  preparationTime: string | null
  cookingTime: string | null
  difficulty: CmRecipeDifficulty | null
  servings: number
  steps: string | null
  image: string | null
  cookId: string | null
  ingredients: CmRecipeIngredient[]
  supplies: CmRecipeSupply[]
  ingredientsCost: number
  suppliesCost: number
  totalCost: number
  costPerServing: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

interface OptionItem {
  id: string
  name: string
  purchaseUnit: string
  purchasePrice: number
}

interface FormIngredient {
  key: string
  ingredientId: string
  quantity: number
  unit: string
  pricePerUnit: number
}

interface FormSupply {
  key: string
  supplyId: string
  quantity: number
  unit: string
  pricePerUnit: number
}

type FormMode = 'create' | 'edit'

// ============================================================
// Constantes
// ============================================================

const CATEGORIES: { value: CmRecipeCategory; label: string }[] = [
  { value: 'carnes', label: 'Carnes' },
  { value: 'pastas', label: 'Pastas' },
  { value: 'postres', label: 'Postres' },
  { value: 'aperitivos', label: 'Aperitivos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'otros', label: 'Otros' },
]

const DIFFICULTIES: { value: CmRecipeDifficulty; label: string }[] = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Media' },
  { value: 'dificil', label: 'Difícil' },
]

const CATEGORY_LABEL: Record<CmRecipeCategory, string> = {
  carnes: 'Carnes',
  pastas: 'Pastas',
  postres: 'Postres',
  aperitivos: 'Aperitivos',
  bebidas: 'Bebidas',
  otros: 'Otros',
}

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (value: number): string => `$${Number(value || 0).toLocaleString('es-AR')}`


const newItemKey = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `item-${crypto.randomUUID()}`
    : `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// ============================================================
// Página
// ============================================================

function CmRecetasPageContent() {
  const searchParams = useSearchParams()
  const [recipes, setRecipes] = React.useState<CmRecipeRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [catFilter, setCatFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editItem, setEditItem] = React.useState<CmRecipeRecord | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<CmRecipeRecord | null>(null)

  const [ingredients, setIngredients] = React.useState<OptionItem[]>([])
  const [supplies, setSupplies] = React.useState<OptionItem[]>([])

  // Carga de dropdowns (una sola vez al montar)
  React.useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [iRes, supRes] = await Promise.all([
          fetch('/api/cocina-movil/ingredients?isActive=true'),
          fetch('/api/cocina-movil/supplies?isActive=true'),
        ])
        const [iData, supData] = await Promise.all([
          iRes.json().catch(() => ({})),
          supRes.json().catch(() => ({})),
        ])
        setIngredients((iData.ingredients || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({
          id: x.id, name: x.name, purchaseUnit: x.purchaseUnit, purchasePrice: x.purchasePrice,
        })))
        setSupplies((supData.supplies || []).map((x: { id: string; name: string; purchaseUnit: string; purchasePrice: number }) => ({
          id: x.id, name: x.name, purchaseUnit: x.purchaseUnit, purchasePrice: x.purchasePrice,
        })))
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

  const loadRecipes = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (catFilter !== 'all') params.set('category', catFilter)
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
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
  }, [search, catFilter, statusFilter])

  React.useEffect(() => {
    const id = setTimeout(loadRecipes, 250)
    return () => clearTimeout(id)
  }, [loadRecipes])

  const openCreate = () => { setFormMode('create'); setEditItem(null); setFormOpen(true) }
  const openEdit = (item: CmRecipeRecord) => { setFormMode('edit'); setEditItem(item); setFormOpen(true) }

  const handleToggle = async (item: CmRecipeRecord) => {
    try {
      const res = await fetch(`/api/cocina-movil/recipes/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Receta ${item.isActive ? 'desactivada' : 'activada'}`)
      loadRecipes()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/cocina-movil/recipes/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Receta eliminada')
      setDeleteItem(null)
      loadRecipes()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (catFilter !== 'all') params.set('category', catFilter)
    if (statusFilter === 'active') params.set('isActive', 'true')
    if (statusFilter === 'inactive') params.set('isActive', 'false')
    window.open(`/api/cocina-movil/recipes/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <ChefHat className="h-6 w-6" />Recetas
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />Nueva Receta
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por título o descripción…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
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
                    <TableHead className="w-16">Imagen</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Porciones</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="text-right">Costo/Porción</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((r, i) => (
                    <TableRow key={r.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image} alt={r.title} className="h-[30px] w-[40px] object-cover rounded border border-[#5C3A21]/15" />
                        ) : (
                          <div className="h-[30px] w-[40px] flex items-center justify-center rounded border border-[#5C3A21]/15 bg-[#FFF8E7]">
                            <ChefHat className="h-4 w-4 text-[#8A7E70]" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[#5C3A21]">{r.title}</p>
                        {r.description && <p className="text-xs text-[#8A7E70] line-clamp-1">{r.description}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[#5C3A21]/10 text-[#5C3A21] hover:bg-[#5C3A21]/15 capitalize">{CATEGORY_LABEL[r.category]}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-[#4A3F36]">{r.servings}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">{fmtCurrency(r.totalCost)}</TableCell>
                      <TableCell className="text-right text-sm text-[#4A3F36] whitespace-nowrap">{fmtCurrency(r.costPerServing)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[10px] ${r.isActive ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#8A7E70] hover:bg-[#8A7E70]'}`}>
                          {r.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(r)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(r)}>
                              <Switch checked={r.isActive} className="scale-75 mr-1" />
                              {r.isActive ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(r)} className="text-[#B91C1C] focus:text-[#B91C1C]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
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

      {/* Form Dialog (4 secciones) */}
      <RecipeFormDialog
        open={formOpen}
        mode={formMode}
        item={editItem}
        ingredients={ingredients}
        supplies={supplies}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadRecipes() }}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar receta?</DialogTitle>
            <DialogDescription>
              Estás por eliminar la receta <strong>{deleteItem?.title}</strong> con un costo total de{' '}
              <strong>{deleteItem ? fmtCurrency(deleteItem.totalCost) : ''}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
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

// ============================================================
// Form Dialog — 4 secciones
// ============================================================

interface RecipeFormDialogProps {
  open: boolean
  mode: FormMode
  item: CmRecipeRecord | null
  ingredients: OptionItem[]
  supplies: OptionItem[]
  onClose: () => void
  onSaved: () => void
}

function RecipeFormDialog({ open, mode, item, ingredients, supplies, onClose, onSaved }: RecipeFormDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [category, setCategory] = React.useState<CmRecipeCategory | ''>('')
  const [preparationTime, setPreparationTime] = React.useState('')
  const [cookingTime, setCookingTime] = React.useState('')
  const [difficulty, setDifficulty] = React.useState<CmRecipeDifficulty | '__none__'>('__none__')
  const [servings, setServings] = React.useState('1')
  const [steps, setSteps] = React.useState('')
  const [image, setImage] = React.useState<string>('')
  const [isActive, setIsActive] = React.useState(true)
  const [cookId, setCookId] = React.useState<string>('')

  const [ingItems, setIngItems] = React.useState<FormIngredient[]>([])
  const [supItems, setSupItems] = React.useState<FormSupply[]>([])

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setTitle(item.title)
        setDescription(item.description || '')
        setCategory(item.category)
        setPreparationTime(item.preparationTime || '')
        setCookingTime(item.cookingTime || '')
        setDifficulty(item.difficulty || '__none__')
        setServings(String(item.servings || 1))
        setSteps(item.steps || '')
        setImage(item.image || '')
        setIsActive(item.isActive)
        setCookId(item.cookId || '')
        setIngItems(item.ingredients.map((it) => {
          const ing = ingredients.find((x) => x.id === it.ingredientId)
          return {
            key: newItemKey(),
            ingredientId: it.ingredientId,
            quantity: it.quantity,
            unit: it.unit,
            pricePerUnit: ing?.purchasePrice ?? 0,
          }
        }))
        setSupItems(item.supplies.map((it) => {
          const sup = supplies.find((x) => x.id === it.supplyId)
          return {
            key: newItemKey(),
            supplyId: it.supplyId,
            quantity: it.quantity,
            unit: it.unit,
            pricePerUnit: sup?.purchasePrice ?? 0,
          }
        }))
      } else {
        setTitle('')
        setDescription('')
        setCategory('')
        setPreparationTime('')
        setCookingTime('')
        setDifficulty('__none__')
        setServings('1')
        setSteps('')
        setImage('')
        setIsActive(true)
        setCookId('')
        setIngItems([])
        setSupItems([])
      }
      setError(null)
    }
  }, [open, mode, item, ingredients, supplies])

  // Cálculo dinámico de costos
  const ingredientsCost = ingItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0)
  const suppliesCost = supItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0)
  const totalCost = ingredientsCost + suppliesCost
  const servingsNum = Number(servings) || 0
  const costPerServing = servingsNum > 0 ? totalCost / servingsNum : 0

  // Ingredientes (sección 2)
  const addIngredient = () => {
    setIngItems((arr) => [...arr, { key: newItemKey(), ingredientId: '', quantity: 1, unit: '', pricePerUnit: 0 }])
  }
  const removeIngredient = (key: string) => setIngItems((arr) => arr.filter((it) => it.key !== key))
  const updateIngredient = (key: string, patch: Partial<FormIngredient>) =>
    setIngItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const onIngredientSelect = (key: string, id: string) => {
    const prod = ingredients.find((p) => p.id === id)
    updateIngredient(key, {
      ingredientId: id,
      unit: prod?.purchaseUnit || '',
      pricePerUnit: prod?.purchasePrice || 0,
    })
  }

  // Insumos (sección 3)
  const addSupply = () => {
    setSupItems((arr) => [...arr, { key: newItemKey(), supplyId: '', quantity: 1, unit: '', pricePerUnit: 0 }])
  }
  const removeSupply = (key: string) => setSupItems((arr) => arr.filter((it) => it.key !== key))
  const updateSupply = (key: string, patch: Partial<FormSupply>) =>
    setSupItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const onSupplySelect = (key: string, id: string) => {
    const prod = supplies.find((p) => p.id === id)
    updateSupply(key, {
      supplyId: id,
      unit: prod?.purchaseUnit || '',
      pricePerUnit: prod?.purchasePrice || 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) return setError('El título es obligatorio')
    if (!category) return setError('La categoría es obligatoria')
    const serv = Number(servings)
    if (!serv || serv <= 0) return setError('Las porciones deben ser mayores a 0')

    const validIngredients = ingItems
      .filter((it) => it.ingredientId && Number(it.quantity) > 0)
      .map((it) => ({ ingredientId: it.ingredientId, quantity: Number(it.quantity), unit: it.unit || 'u' }))
    const validSupplies = supItems
      .filter((it) => it.supplyId && Number(it.quantity) > 0)
      .map((it) => ({ supplyId: it.supplyId, quantity: Number(it.quantity), unit: it.unit || 'u' }))

    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        preparationTime: preparationTime.trim() || null,
        cookingTime: cookingTime.trim() || null,
        difficulty: difficulty === '__none__' ? null : difficulty,
        servings: serv,
        steps: steps.trim() || null,
        image: image || null,
        cookId: cookId || null,
        ingredients: validIngredients,
        supplies: validSupplies,
        isActive,
      }
      const url = mode === 'create' ? '/api/cocina-movil/recipes' : `/api/cocina-movil/recipes/${item!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      toast.success(mode === 'create' ? 'Receta creada' : 'Receta actualizada')
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
            <ChefHat className="h-5 w-5" />
            {mode === 'create' ? 'Nueva Receta' : 'Editar Receta'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Cargá una nueva receta con ingredientes, insumos y cálculo de costos automático.'
              : `Editando "${item?.title}"`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>
          )}

          {/* ============ SECCIÓN 1: Datos de la Receta ============ */}
          <SectionCard number={1} title="Datos de la Receta" icon={<ChefHat className="h-4 w-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Sorrentinos de Ricotta y Espinaca" className="border-[#5C3A21]/15" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Descripción</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción de la receta…" rows={2} className="border-[#5C3A21]/15 resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Categoría *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CmRecipeCategory)}>
                  <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Dificultad</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as CmRecipeDifficulty | '__none__')}>
                  <SelectTrigger className="border-[#5C3A21]/15"><SelectValue placeholder="Seleccionar dificultad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin especificar —</SelectItem>
                    {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Tiempo de Preparación</Label>
                <Input value={preparationTime} onChange={(e) => setPreparationTime(e.target.value)} placeholder="30 min" className="border-[#5C3A21]/15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Tiempo de Cocción</Label>
                <Input value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} placeholder="15 min" className="border-[#5C3A21]/15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Porciones *</Label>
                <Input type="number" min="1" step="1" value={servings} onChange={(e) => setServings(e.target.value)} className="border-[#5C3A21]/15" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Pasos de Preparación</Label>
                <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'1. Paso uno\n2. Paso dos'} rows={4} className="border-[#5C3A21]/15 resize-none" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Imagen de la Receta</Label>
                <ImageUploader
                  value={image || null}
                  onChange={(url) => setImage(url || '')}
                  uploadUrl="/api/cocina-movil/recipes/upload-image"
                  label="Imagen de la receta"
                  aspectRatio="4/3"
                  disabled={saving}
                />
              </div>
            </div>
          </SectionCard>

          {/* ============ SECCIÓN 2: Ingredientes ============ */}
          <SectionCard number={2} title="Ingredientes (Materias Primas)" icon={<Package className="h-4 w-4" />}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8A7E70]">Agregá las materias primas necesarias. El costo se calcula automáticamente.</p>
              <Button type="button" size="sm" variant="outline" onClick={addIngredient} className="border-[#5C3A21]/20 text-[#5C3A21]">
                <Plus className="h-3.5 w-3.5" />Agregar Ingrediente
              </Button>
            </div>

            {ingItems.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#5C3A21]/20 rounded-md">
                <Package className="h-6 w-6 mx-auto mb-1 text-[#8A7E70]/40" />
                <p className="text-sm text-[#8A7E70]">No hay ingredientes. Hacé clic en &quot;Agregar Ingrediente&quot;.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden lg:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-[#8A7E70]">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-2 text-right">Cant.</div>
                  <div className="col-span-2">Unidad</div>
                  <div className="col-span-2 text-right">Precio/U</div>
                  <div className="col-span-1 text-right">Subtotal</div>
                </div>
                {ingItems.map((it) => {
                  const subtotal = (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0)
                  return (
                    <div key={it.key} className="grid grid-cols-2 lg:grid-cols-12 gap-2 p-2 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
                      {/* Producto */}
                      <div className="col-span-2 lg:col-span-5">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Producto</Label>
                        <Select value={it.ingredientId} onValueChange={(v) => onIngredientSelect(it.key, v)}>
                          <SelectTrigger className="h-9 border-[#5C3A21]/15 text-xs">
                            <SelectValue placeholder="Seleccionar materia prima…" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.length === 0 ? (
                              <SelectItem value="__empty__" disabled>No hay materias primas</SelectItem>
                            ) : (
                              ingredients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Cantidad */}
                      <div className="lg:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Cant.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => updateIngredient(it.key, { quantity: Number(e.target.value) })}
                          className="h-9 border-[#5C3A21]/15 text-xs text-right"
                        />
                      </div>
                      {/* Unidad */}
                      <div className="lg:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Unidad</Label>
                        <Input
                          value={it.unit}
                          onChange={(e) => updateIngredient(it.key, { unit: e.target.value })}
                          placeholder="kg"
                          className="h-9 border-[#5C3A21]/15 text-xs"
                        />
                      </div>
                      {/* Precio/U (read-only visual, editable para flexibilidad) */}
                      <div className="lg:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Precio/U</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={it.pricePerUnit}
                          readOnly
                          tabIndex={-1}
                          className="h-9 border-[#5C3A21]/15 text-xs text-right bg-[#FBF1DC]/60 text-[#8A7E70] cursor-not-allowed"
                        />
                      </div>
                      {/* Subtotal + remove */}
                      <div className="col-span-2 lg:col-span-1 flex items-center justify-end gap-1">
                        <div className="flex-1 text-right text-sm font-semibold text-[#5C3A21]">{fmtCurrency(subtotal)}</div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeIngredient(it.key)}
                          className="h-8 w-8 text-[#B91C1C] hover:bg-[#B91C1C]/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-end pt-2 border-t border-[#5C3A21]/10">
                  <div className="text-sm">
                    <span className="text-[#8A7E70] mr-2">Costo de Ingredientes:</span>
                    <span className="font-bold text-[#5C3A21]">{fmtCurrency(ingredientsCost)}</span>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ============ SECCIÓN 3: Insumos ============ */}
          <SectionCard number={3} title="Insumos" icon={<FlaskConical className="h-4 w-4" />}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8A7E70]">Agregá los insumos utilizados (envases, film, etc.).</p>
              <Button type="button" size="sm" variant="outline" onClick={addSupply} className="border-[#5C3A21]/20 text-[#5C3A21]">
                <Plus className="h-3.5 w-3.5" />Agregar Insumo
              </Button>
            </div>

            {supItems.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#5C3A21]/20 rounded-md">
                <FlaskConical className="h-6 w-6 mx-auto mb-1 text-[#8A7E70]/40" />
                <p className="text-sm text-[#8A7E70]">No hay insumos. Hacé clic en &quot;Agregar Insumo&quot;.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden lg:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-[#8A7E70]">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-2 text-right">Cant.</div>
                  <div className="col-span-2">Unidad</div>
                  <div className="col-span-2 text-right">Precio/U</div>
                  <div className="col-span-1 text-right">Subtotal</div>
                </div>
                {supItems.map((it) => {
                  const subtotal = (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0)
                  return (
                    <div key={it.key} className="grid grid-cols-2 lg:grid-cols-12 gap-2 p-2 rounded-md border border-[#5C3A21]/10 bg-[#FFF8E7]/30">
                      {/* Producto */}
                      <div className="col-span-2 lg:col-span-5">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Producto</Label>
                        <Select value={it.supplyId} onValueChange={(v) => onSupplySelect(it.key, v)}>
                          <SelectTrigger className="h-9 border-[#5C3A21]/15 text-xs">
                            <SelectValue placeholder="Seleccionar insumo…" />
                          </SelectTrigger>
                          <SelectContent>
                            {supplies.length === 0 ? (
                              <SelectItem value="__empty__" disabled>No hay insumos</SelectItem>
                            ) : (
                              supplies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Cantidad */}
                      <div className="lg:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Cant.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => updateSupply(it.key, { quantity: Number(e.target.value) })}
                          className="h-9 border-[#5C3A21]/15 text-xs text-right"
                        />
                      </div>
                      {/* Unidad */}
                      <div className="lg:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Unidad</Label>
                        <Input
                          value={it.unit}
                          onChange={(e) => updateSupply(it.key, { unit: e.target.value })}
                          placeholder="u"
                          className="h-9 border-[#5C3A21]/15 text-xs"
                        />
                      </div>
                      {/* Precio/U read-only */}
                      <div className="lg:col-span-2">
                        <Label className="text-[10px] text-[#8A7E70] lg:hidden">Precio/U</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={it.pricePerUnit}
                          readOnly
                          tabIndex={-1}
                          className="h-9 border-[#5C3A21]/15 text-xs text-right bg-[#FBF1DC]/60 text-[#8A7E70] cursor-not-allowed"
                        />
                      </div>
                      {/* Subtotal + remove */}
                      <div className="col-span-2 lg:col-span-1 flex items-center justify-end gap-1">
                        <div className="flex-1 text-right text-sm font-semibold text-[#5C3A21]">{fmtCurrency(subtotal)}</div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSupply(it.key)}
                          className="h-8 w-8 text-[#B91C1C] hover:bg-[#B91C1C]/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-end pt-2 border-t border-[#5C3A21]/10">
                  <div className="text-sm">
                    <span className="text-[#8A7E70] mr-2">Costo de Insumos:</span>
                    <span className="font-bold text-[#5C3A21]">{fmtCurrency(suppliesCost)}</span>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ============ SECCIÓN 4: Costos ============ */}
          <SectionCard number={4} title="Costos" icon={<Calculator className="h-4 w-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CostRow label="Costo de Ingredientes" value={fmtCurrency(ingredientsCost)} />
              <CostRow label="Costo de Insumos" value={fmtCurrency(suppliesCost)} />
              <div className="sm:col-span-2 p-3 rounded-md bg-[#E1AD01]/10 border border-[#E1AD01]/30 flex items-center justify-between">
                <span className="text-sm font-medium text-[#5C3A21] flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-[#E1AD01]" />Costo Total
                </span>
                <span className="text-xl font-bold text-[#5C3A21]">{fmtCurrency(totalCost)}</span>
              </div>
              <div className="sm:col-span-2 p-3 rounded-md bg-[#FBF1DC] border border-[#5C3A21]/15 flex items-center justify-between">
                <span className="text-sm font-medium text-[#5C3A21]">Costo por Porción ({servingsNum} porciones)</span>
                <span className="text-xl font-bold text-[#708238]">{fmtCurrency(costPerServing)}</span>
              </div>
            </div>
          </SectionCard>

          {mode === 'edit' && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-[#FFF8E7]/50 border border-[#5C3A21]/10">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-sm text-[#5C3A21] cursor-pointer" onClick={() => setIsActive((v) => !v)}>
                {isActive ? 'Receta activa' : 'Receta inactiva'}
              </Label>
            </div>
          )}

          {/* Footer sticky: Total + acciones */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 px-6 pb-4 pt-3 border-t border-[#5C3A21]/10 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-[#8A7E70]">Costo Total / Porción</span>
              <span className="text-lg font-bold text-[#5C3A21]">
                {fmtCurrency(totalCost)} <span className="text-[#8A7E70] text-sm font-normal">· {fmtCurrency(costPerServing)}</span>
              </span>
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
// Sub-componentes: SectionCard y CostRow
// ============================================================

function SectionCard({ number, title, icon, children }: { number: number; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#5C3A21]/10 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#FBF1DC] border-b border-[#5C3A21]/10">
        <div className="h-7 w-7 rounded-full bg-[#5C3A21] text-white flex items-center justify-center text-sm font-bold">{number}</div>
        <h3 className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
          {icon}{title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-md bg-[#FFF8E7]/40 border border-[#5C3A21]/10 flex items-center justify-between">
      <span className="text-sm text-[#5C3A21]">{label}</span>
      <span className="text-sm font-semibold text-[#5C3A21]">{value}</span>
    </div>
  )
}

// ============================================================
// Export (con Suspense)
// ============================================================

export default function CmRecetasPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <CmRecetasPageContent />
    </React.Suspense>
  )
}
