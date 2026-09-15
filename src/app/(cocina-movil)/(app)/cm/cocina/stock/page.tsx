'use client'

/**
 * ============================================================
 * Cocinero — Consultar Stock (READ-ONLY)
 * ============================================================
 * URL: /cm/cocina/stock
 *
 * Vista de solo lectura para el rol Cocinero.
 * - Dos tabs: "Materias Primas" y "Insumos"
 * - Cada item muestra: nombre, categoría, unidad de compra,
 *   precio por unidad, total gramos/medida, precio por
 *   gramo/uso
 * - Búsqueda + filtro por categoría (categorías propias de
 *   cada tab)
 * - SIN botones de crear/editar/eliminar
 * - Resalta items de stock bajo (totalGrams < 500 para MP;
 *   purchasePrice < 100 para Insumos)
 * ============================================================
 */

import * as React from 'react'
import {
  Package, Search, Loader2, FlaskConical, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// ============================================================
// Tipos
// ============================================================

interface CmIngredient {
  id: string
  name: string
  description: string | null
  category: string | null
  purchaseUnit: string
  purchasePrice: number
  gramsPerUnit: number | null
  isActive: boolean
  purchaseUnitType: string | null
  unitsPurchased: number | null
  weightPerUnit: number | null
  weightUnit: string | null
  totalPrice: number | null
  pricePerUnit: number | null
  totalGrams: number | null
  createdAt: number
}

interface CmSupply {
  id: string
  name: string
  description: string | null
  category: string | null
  purchaseUnit: string
  purchasePrice: number
  isActive: boolean
  purchaseUnitType: string | null
  unitsPurchased: number | null
  measurePerUnit: number | null
  measureUnit: string | null
  totalPrice: number | null
  usageUnit: string | null
  equivalenceValue: number | null
  equivalenceUnit: string | null
  pricePerPurchaseUnit: number | null
  pricePerUsageUnit: number | null
  createdAt: number
}

// ============================================================
// Constantes
// ============================================================

const INGREDIENT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'harinas', label: 'Harinas' },
  { value: 'carnes', label: 'Carnes' },
  { value: 'lacteos', label: 'Lácteos' },
  { value: 'verduras', label: 'Verduras' },
  { value: 'especias', label: 'Especias' },
  { value: 'aceites', label: 'Aceites' },
  { value: 'otros', label: 'Otros' },
]

const SUPPLY_CATEGORIES: { value: string; label: string }[] = [
  { value: 'envases', label: 'Envases' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'descartables', label: 'Descartables' },
  { value: 'otros', label: 'Otros' },
]

function ingredientCatLabel(cat: string | null): string {
  if (!cat) return 'Otros'
  const found = INGREDIENT_CATEGORIES.find((c) => c.value === cat)
  return found ? found.label : cat
}

function supplyCatLabel(cat: string | null): string {
  if (!cat) return 'Otros'
  const found = SUPPLY_CATEGORIES.find((c) => c.value === cat)
  return found ? found.label : cat
}

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (v: number | null | undefined) =>
  `$${Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

const fmtNumber = (v: number | null | undefined, digits = 2) =>
  Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: digits })

// ============================================================
// Página
// ============================================================

export default function CookStockPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
          <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
        </div>
      }
    >
      <CookStockPageContent />
    </React.Suspense>
  )
}

function CookStockPageContent() {
  const [ingredients, setIngredients] = React.useState<CmIngredient[]>([])
  const [supplies, setSupplies] = React.useState<CmSupply[]>([])

  const [ingSearch, setIngSearch] = React.useState('')
  const [ingCat, setIngCat] = React.useState<string>('all')
  const [supSearch, setSupSearch] = React.useState('')
  const [supCat, setSupCat] = React.useState<string>('all')

  // Búsqueda debounced para ingredientes
  const [ingSearchDebounced, setIngSearchDebounced] = React.useState('')
  React.useEffect(() => {
    const id = setTimeout(() => setIngSearchDebounced(ingSearch), 250)
    return () => clearTimeout(id)
  }, [ingSearch])

  // Búsqueda debounced para supplies
  const [supSearchDebounced, setSupSearchDebounced] = React.useState('')
  React.useEffect(() => {
    const id = setTimeout(() => setSupSearchDebounced(supSearch), 250)
    return () => clearTimeout(id)
  }, [supSearch])

  // Carga ingredientes cuando cambia la búsqueda o categoría
  const loadIngredients = React.useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (ingSearchDebounced) params.set('search', ingSearchDebounced)
      if (ingCat !== 'all') params.set('category', ingCat)
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/ingredients?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      setIngredients(data.ingredients || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar materias primas')
    }
  }, [ingSearchDebounced, ingCat])

  React.useEffect(() => {
    const id = setTimeout(loadIngredients, 0)
    return () => clearTimeout(id)
  }, [loadIngredients])

  // Carga supplies cuando cambia la búsqueda o categoría
  const loadSupplies = React.useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (supSearchDebounced) params.set('search', supSearchDebounced)
      if (supCat !== 'all') params.set('category', supCat)
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/supplies?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      setSupplies(data.supplies || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar insumos')
    }
  }, [supSearchDebounced, supCat])

  React.useEffect(() => {
    const id = setTimeout(loadSupplies, 0)
    return () => clearTimeout(id)
  }, [loadSupplies])

  // Loading state derivado: si ambos estados están vacíos pero la búsqueda ya se disparó
  const loading = ingredients.length === 0 && supplies.length === 0 && !ingSearchDebounced && !supSearchDebounced

  // Filas destacadas (stock bajo)
  const lowStockIngCount = ingredients.filter((i) => {
    const totalG = i.totalGrams ?? i.gramsPerUnit ?? 0
    return totalG > 0 && totalG < 500
  }).length

  const lowStockSupCount = supplies.filter((s) => s.purchasePrice < 100).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
          <Package className="h-6 w-6" />Consultar Stock
        </h1>
        <p className="text-sm text-[#8A7E70]">Vista de solo lectura del inventario disponible</p>
      </div>

      {/* Resumen stock bajo */}
      {(lowStockIngCount > 0 || lowStockSupCount > 0) && (
        <Card className="border-[#B91C1C]/30 bg-[#B91C1C]/5 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[#B91C1C]">Stock bajo detectado</p>
              <p className="text-[#4A3F36]">
                {lowStockIngCount > 0 && <>{lowStockIngCount} materia(s) prima(s) con menos de 500 g</>}
                {lowStockIngCount > 0 && lowStockSupCount > 0 && <> · </>}
                {lowStockSupCount > 0 && <>{lowStockSupCount} insumo(s) con precio menor a $100</>}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ingredients" className="w-full">
        <TabsList className="bg-[#FBF1DC] border border-[#5C3A21]/15 h-auto">
          <TabsTrigger
            value="ingredients"
            className="data-[state=active]:bg-[#5C3A21] data-[state=active]:text-[#FFF8E7] text-[#5C3A21] gap-1.5"
          >
            <Package className="h-4 w-4" />
            Materias Primas
            {ingredients.length > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] border-[#5C3A21]/20">
                {ingredients.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="supplies"
            className="data-[state=active]:bg-[#5C3A21] data-[state=active]:text-[#FFF8E7] text-[#5C3A21] gap-1.5"
          >
            <FlaskConical className="h-4 w-4" />
            Insumos
            {supplies.length > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] border-[#5C3A21]/20">
                {supplies.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: Materias Primas */}
        <TabsContent value="ingredients" className="space-y-4">
          <Card className="border-[#5C3A21]/10 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
                  <Input
                    placeholder="Buscar materia prima…"
                    value={ingSearch}
                    onChange={(e) => setIngSearch(e.target.value)}
                    className="pl-9 border-[#5C3A21]/15 bg-white"
                  />
                </div>
                <Select value={ingCat} onValueChange={setIngCat}>
                  <SelectTrigger className="w-full lg:w-48 border-[#5C3A21]/15">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#5C3A21]/10 shadow-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
                  <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
                </div>
              ) : ingredients.length === 0 ? (
                <div className="py-16 text-center">
                  <Package className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
                  <p className="text-sm text-[#8A7E70]">No se encontraron materias primas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="hidden md:table-cell">Categoría</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Total (g)</TableHead>
                        <TableHead className="text-right">Precio/g</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredients.map((ing, i) => {
                        const totalGrams = ing.totalGrams ?? ing.gramsPerUnit ?? 0
                        const isLow = totalGrams > 0 && totalGrams < 500
                        const pricePerGram = ing.pricePerUnit ?? (ing.totalPrice && totalGrams ? ing.totalPrice / totalGrams : 0)
                        return (
                          <TableRow
                            key={ing.id}
                            className={`border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50 ${isLow ? 'bg-[#B91C1C]/5' : ''}`}
                          >
                            <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium text-[#5C3A21]">{ing.name}</p>
                              {ing.description && (
                                <p className="text-xs text-[#8A7E70] line-clamp-1">{ing.description}</p>
                              )}
                              <p className="text-xs text-[#8A7E70] md:hidden">{ingredientCatLabel(ing.category)}</p>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-[10px] border-[#5C3A21]/20 text-[#5C3A21]">
                                {ingredientCatLabel(ing.category)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-[#4A3F36]">{ing.purchaseUnit}</TableCell>
                            <TableCell className="text-right text-sm text-[#4A3F36] whitespace-nowrap">
                              {fmtCurrency(ing.totalPrice ?? ing.purchasePrice)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-[#4A3F36] whitespace-nowrap">
                              {fmtNumber(totalGrams, 0)} g
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-[#5C3A21] whitespace-nowrap">
                              {fmtCurrency(pricePerGram)}
                            </TableCell>
                            <TableCell className="text-center">
                              {isLow ? (
                                <Badge className="text-[10px] bg-[#B91C1C] hover:bg-[#B91C1C] text-white gap-1">
                                  <AlertTriangle className="h-3 w-3" />Bajo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] border-[#708238]/30 text-[#708238]">
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Insumos */}
        <TabsContent value="supplies" className="space-y-4">
          <Card className="border-[#5C3A21]/10 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
                  <Input
                    placeholder="Buscar insumo…"
                    value={supSearch}
                    onChange={(e) => setSupSearch(e.target.value)}
                    className="pl-9 border-[#5C3A21]/15 bg-white"
                  />
                </div>
                <Select value={supCat} onValueChange={setSupCat}>
                  <SelectTrigger className="w-full lg:w-48 border-[#5C3A21]/15">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {SUPPLY_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#5C3A21]/10 shadow-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
                  <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
                </div>
              ) : supplies.length === 0 ? (
                <div className="py-16 text-center">
                  <FlaskConical className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
                  <p className="text-sm text-[#8A7E70]">No se encontraron insumos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="hidden md:table-cell">Categoría</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Precio/U</TableHead>
                        <TableHead className="text-right">Total (medida)</TableHead>
                        <TableHead className="text-right">Precio/uso</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplies.map((sup, i) => {
                        const totalMeasure = (sup.unitsPurchased ?? 0) * (sup.measurePerUnit ?? 1)
                        const isLow = sup.purchasePrice < 100
                        const unitLabel = sup.usageUnit || sup.measureUnit || sup.purchaseUnit || ''
                        return (
                          <TableRow
                            key={sup.id}
                            className={`border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50 ${isLow ? 'bg-[#B91C1C]/5' : ''}`}
                          >
                            <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium text-[#5C3A21]">{sup.name}</p>
                              {sup.description && (
                                <p className="text-xs text-[#8A7E70] line-clamp-1">{sup.description}</p>
                              )}
                              <p className="text-xs text-[#8A7E70] md:hidden">{supplyCatLabel(sup.category)}</p>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-[10px] border-[#5C3A21]/20 text-[#5C3A21]">
                                {supplyCatLabel(sup.category)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-[#4A3F36]">{sup.purchaseUnit}</TableCell>
                            <TableCell className="text-right text-sm text-[#4A3F36] whitespace-nowrap">
                              {fmtCurrency(sup.pricePerPurchaseUnit ?? sup.purchasePrice)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-[#4A3F36] whitespace-nowrap">
                              {fmtNumber(totalMeasure, 0)} {unitLabel}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-[#5C3A21] whitespace-nowrap">
                              {fmtCurrency(sup.pricePerUsageUnit ?? sup.purchasePrice)}
                            </TableCell>
                            <TableCell className="text-center">
                              {isLow ? (
                                <Badge className="text-[10px] bg-[#B91C1C] hover:bg-[#B91C1C] text-white gap-1">
                                  <AlertTriangle className="h-3 w-3" />Bajo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] border-[#708238]/30 text-[#708238]">
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
