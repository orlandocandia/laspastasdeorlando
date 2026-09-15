'use client'

/**
 * ============================================================
 * Cocinero — Mis Lugares (READ-ONLY)
 * ============================================================
 * URL: /cm/cocina/lugares
 *
 * Vista de solo lectura para el rol Cocinero.
 * - Lista de lugares con búsqueda por nombre / descripción /
 *   dirección / contacto
 * - Cada lugar: nombre, descripción, dirección, estado
 * - Botón "Nuevo Lugar" → /cm/admin/lugares?action=new
 * - Botones de exportación (Imprimir / PDF / Word / Excel)
 * - Acción "Editar" → /cm/admin/lugares (vista admin)
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import {
  MapPin, Search, Printer, FileText, FileDown, FileSpreadsheet,
  Loader2, Plus, Pencil, Building,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

// ============================================================
// Tipos
// ============================================================

interface CmPlaceListItem {
  id: string
  name: string
  description: string | null
  contactName: string | null
  address: string | null
  country: string | null
  province: string | null
  isActive: boolean
  createdAt: number
}

// ============================================================
// Página
// ============================================================

export default function CookLugaresPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
          <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
        </div>
      }
    >
      <CookLugaresPageContent />
    </React.Suspense>
  )
}

function CookLugaresPageContent() {
  const [places, setPlaces] = React.useState<CmPlaceListItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const loadPlaces = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/places?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setPlaces(data.places || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar lugares')
    } finally {
      setLoading(false)
    }
  }, [search])

  React.useEffect(() => {
    const id = setTimeout(loadPlaces, 250)
    return () => clearTimeout(id)
  }, [loadPlaces])

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    window.open(`/api/cocina-movil/places/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <MapPin className="h-6 w-6" />Mis Lugares
          </h1>
          <p className="text-sm text-[#8A7E70]">{total} en total</p>
        </div>
        <Button asChild className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Link href="/cm/admin/lugares?action=new">
            <Plus className="h-4 w-4" />Nuevo Lugar
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por nombre, descripción o dirección…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
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
          ) : places.length === 0 ? (
            <div className="py-16 text-center">
              <MapPin className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron lugares.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Descripción</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="hidden md:table-cell">Responsable</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {places.map((p, i) => {
                    const addr = [p.address, p.province, p.country].filter(Boolean).join(', ')
                    return (
                      <TableRow key={p.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                        <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-[#5C3A21] flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-[#8A7E70]" />
                            {p.name}
                          </p>
                          <p className="text-xs text-[#8A7E70] md:hidden line-clamp-1">{p.description || '—'}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">
                          <span className="line-clamp-2 max-w-xs">{p.description || '—'}</span>
                        </TableCell>
                        <TableCell className="text-sm text-[#4A3F36]">
                          {addr || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{p.contactName || '—'}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] ${p.isActive ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#8A7E70] hover:bg-[#8A7E70]'}`}>
                            {p.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline" className="h-8 border-[#5C3A21]/20 text-[#5C3A21]">
                            <Link href="/cm/admin/lugares">
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
