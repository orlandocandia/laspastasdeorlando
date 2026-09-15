'use client'

/**
 * ============================================================
 * Cocinero — Mis Producciones (READ-ONLY)
 * ============================================================
 * URL: /cm/cocina/producciones
 *
 * Vista de solo lectura para el rol Cocinero.
 * - Lista de producciones con filtros:
 *     · rango de fechas (dateFrom / dateTo)
 *     · receta (recipeId)
 *     · lugar (placeId)
 * - Cada producción: fecha, receta, lugar, cantidad, costo,
 *   badge de estado
 * - Botón "Nueva Producción" → /cm/admin/producciones?action=new
 * - Botones de exportación (Imprimir / PDF / Word / Excel)
 * - Acción "Editar" → /cm/admin/producciones (vista admin)
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Factory, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Loader2, Plus, Pencil, Clock, Check, X,
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
import { toast } from 'sonner'

// ============================================================
// Tipos
// ============================================================

type CmProductionStatus = 'pending' | 'confirmed' | 'rejected'

interface CmProductionListItem {
  id: string
  recipeId: string
  recipeTitle: string
  placeId: string
  placeName: string
  cookId: string | null
  cookName: string | null
  quantity: number
  cost: number
  status: CmProductionStatus
  observations: string | null
  createdAt: number
}

interface RecipeOption { id: string; title: string }
interface PlaceOption { id: string; name: string }

// ============================================================
// Constantes
// ============================================================

const STATUS_META: Record<CmProductionStatus, { label: string; bg: string }> = {
  pending: { label: 'Pendiente', bg: 'bg-[#E1AD01]' },
  confirmed: { label: 'Confirmada', bg: 'bg-[#708238]' },
  rejected: { label: 'Rechazada', bg: 'bg-[#B91C1C]' },
}

// ============================================================
// Helpers
// ============================================================

const fmtCurrency = (v: number) =>
  `$${Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

const fmtDate = (ts: number) => {
  if (!ts) return '—'
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// Convierte un <input type="date"> (yyyy-mm-dd) a epoch ms (mediodía para evitar TZ drift)
const dateInputToEpoch = (s: string): number | null => {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime()
}

// ============================================================
// Página
// ============================================================

export default function CookProduccionesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
          <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
        </div>
      }
    >
      <CookProduccionesPageContent />
    </React.Suspense>
  )
}

function CookProduccionesPageContent() {
  const [productions, setProductions] = React.useState<CmProductionListItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState('')
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')
  const [recipeFilter, setRecipeFilter] = React.useState<string>('all')
  const [placeFilter, setPlaceFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | CmProductionStatus>('all')

  const [recipes, setRecipes] = React.useState<RecipeOption[]>([])
  const [places, setPlaces] = React.useState<PlaceOption[]>([])

  // Cargar dropdowns (recetas y lugares activos) una sola vez
  React.useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          fetch('/api/cocina-movil/recipes?isActive=true&pageSize=200'),
          fetch('/api/cocina-movil/places?isActive=true&pageSize=200'),
        ])
        const [rData, pData] = await Promise.all([
          rRes.json().catch(() => ({})),
          pRes.json().catch(() => ({})),
        ])
        setRecipes((rData.recipes || []).map((r: { id: string; title: string }) => ({
          id: r.id, title: r.title,
        })))
        setPlaces((pData.places || []).map((p: { id: string; name: string }) => ({
          id: p.id, name: p.name,
        })))
      } catch (err) {
        console.error('Error cargando dropdowns:', err)
      }
    }
    loadDropdowns()
  }, [])

  const loadProductions = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (placeFilter !== 'all') params.set('placeId', placeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const fromMs = dateInputToEpoch(dateFrom)
      const toMs = dateInputToEpoch(dateTo)
      if (fromMs) params.set('dateFrom', String(fromMs))
      if (toMs) params.set('dateTo', String(toMs))
      params.set('pageSize', '200')
      params.set('sortBy', 'createdAt')
      params.set('sortOrder', 'desc')
      const res = await fetch(`/api/cocina-movil/productions?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      let list: CmProductionListItem[] = data.productions || []
      // Filtro por receta (cliente, ya que la API no filtra por recipeId)
      if (recipeFilter !== 'all') {
        list = list.filter((p) => p.recipeId === recipeFilter)
      }
      setProductions(list)
      setTotal(data.total || list.length)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar producciones')
    } finally {
      setLoading(false)
    }
  }, [search, recipeFilter, placeFilter, statusFilter, dateFrom, dateTo])

  React.useEffect(() => {
    const id = setTimeout(loadProductions, 250)
    return () => clearTimeout(id)
  }, [loadProductions])

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (placeFilter !== 'all') params.set('placeId', placeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const fromMs = dateInputToEpoch(dateFrom)
    const toMs = dateInputToEpoch(dateTo)
    if (fromMs) params.set('dateFrom', String(fromMs))
    if (toMs) params.set('dateTo', String(toMs))
    window.open(`/api/cocina-movil/productions/export?${params.toString()}`, '_blank')
  }

  const clearFilters = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setRecipeFilter('all')
    setPlaceFilter('all')
    setStatusFilter('all')
  }

  const hasFilters = search || dateFrom || dateTo || recipeFilter !== 'all' || placeFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <Factory className="h-6 w-6" />Mis Producciones
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button asChild className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Link href="/cm/admin/producciones?action=new">
            <Plus className="h-4 w-4" />Nueva Producción
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative md:col-span-2 lg:col-span-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por receta, cocinero o lugar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#8A7E70]">Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="border-[#5C3A21]/15 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#8A7E70]">Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="border-[#5C3A21]/15 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#8A7E70]">Estado</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | CmProductionStatus)}>
                <SelectTrigger className="border-[#5C3A21]/15 bg-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#8A7E70]">Receta</Label>
              <Select value={recipeFilter} onValueChange={setRecipeFilter}>
                <SelectTrigger className="border-[#5C3A21]/15 bg-white">
                  <SelectValue placeholder="Receta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las recetas</SelectItem>
                  {recipes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#8A7E70]">Lugar</Label>
              <Select value={placeFilter} onValueChange={setPlaceFilter}>
                <SelectTrigger className="border-[#5C3A21]/15 bg-white">
                  <SelectValue placeholder="Lugar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los lugares</SelectItem>
                  {places.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#8A7E70] hover:text-[#5C3A21]">
                  Limpiar filtros
                </Button>
              </div>
            )}
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
          ) : productions.length === 0 ? (
            <div className="py-16 text-center">
              <Factory className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron producciones.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Receta</TableHead>
                    <TableHead className="hidden md:table-cell">Lugar</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.map((p, i) => {
                    const meta = STATUS_META[p.status]
                    return (
                      <TableRow key={p.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                        <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                        <TableCell className="text-sm text-[#4A3F36] whitespace-nowrap">{fmtDate(p.createdAt)}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-[#5C3A21]">{p.recipeTitle}</p>
                          <p className="text-xs text-[#8A7E70] md:hidden">{p.placeName}</p>
                          {p.observations && <p className="text-xs text-[#8A7E70] line-clamp-1">{p.observations}</p>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{p.placeName}</TableCell>
                        <TableCell className="text-center text-sm text-[#4A3F36] whitespace-nowrap">
                          {p.quantity} <span className="text-xs text-[#8A7E70]">porc.</span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-[#5C3A21] whitespace-nowrap">{fmtCurrency(p.cost)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] ${meta.bg} text-white`}>
                            {p.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {p.status === 'confirmed' && <Check className="h-3 w-3 mr-1" />}
                            {p.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline" className="h-8 border-[#5C3A21]/20 text-[#5C3A21]">
                            <Link href="/cm/admin/producciones">
                              <Pencil className="h-3.5 w-3.5" />Editar
                            </Link>
                          </Button>
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
    </div>
  )
}
