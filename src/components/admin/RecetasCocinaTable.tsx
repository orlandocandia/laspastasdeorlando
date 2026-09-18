'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Pencil, Trash2, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  Eye, Star, EyeOff, FileDown, Printer,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RecetaCocina {
  id: number
  titulo: string
  descripcion: string | null
  ingredientes: string
  pasos: string
  tiempo_preparacion: string | null
  tiempo_coccion: string | null
  dificultad: string
  imagen: string | null
  categoria: string | null
  visible_en_landing: boolean
  destacado: boolean
  createdAt: string
}

const DIFICULTAD_BADGE: Record<string, string> = {
  facil: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  media: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
  dificil: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
}

const CATEGORIA_LABEL: Record<string, string> = {
  salsas: 'Salsas',
  pastas: 'Pastas',
  postres: 'Postres',
  aperitivos: 'Aperitivos',
  bebidas: 'Bebidas',
  otros: 'Otros',
}

export default function RecetasCocinaTable() {
  const router = useRouter()
  const [recetas, setRecetas] = useState<RecetaCocina[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroDificultad, setFiltroDificultad] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchRecetas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('buscar', search)
      if (filtroCategoria && filtroCategoria !== 'all') params.set('categoria', filtroCategoria)
      if (filtroDificultad && filtroDificultad !== 'all') params.set('dificultad', filtroDificultad)
      params.set('limite', '50')

      const res = await fetch(`/api/recetas-cocina?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar recetas')
      const data = await res.json()
      setRecetas(data.data || [])
    } catch {
      toast.error('Error al cargar recetas de cocina')
    } finally {
      setLoading(false)
    }
  }, [search, filtroCategoria, filtroDificultad])

  useEffect(() => {
    fetchRecetas()
  }, [fetchRecetas])

  useEffect(() => {
    const timeout = setTimeout(() => fetchRecetas(), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/recetas-cocina/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Receta eliminada')
      fetchRecetas()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar receta')
    } finally {
      setDeleteId(null)
    }
  }

  const handleToggleVisible = async (receta: RecetaCocina) => {
    try {
      const res = await fetch(`/api/recetas-cocina/${receta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...receta,
          visible_en_landing: !receta.visible_en_landing,
        }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      toast.success(receta.visible_en_landing ? 'Ocultada de la landing' : 'Visible en landing')
      fetchRecetas()
    } catch {
      toast.error('Error al cambiar visibilidad')
    }
  }

  const handleToggleDestacado = async (receta: RecetaCocina) => {
    try {
      const res = await fetch(`/api/recetas-cocina/${receta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...receta,
          destacado: !receta.destacado,
        }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      toast.success(receta.destacado ? 'Quitado destacado' : 'Marcada como destacada')
      fetchRecetas()
    } catch {
      toast.error('Error al cambiar destacado')
    }
  }

  if (loading && recetas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar receta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroDificultad} onValueChange={setFiltroDificultad}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="facil">Fácil</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="dificil">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => router.push('/admin/recetas-cocina/nueva')}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Receta
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden lg:table-cell">Dificultad</TableHead>
                <TableHead className="text-center">Landing</TableHead>
                <TableHead className="text-center">Destacada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recetas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search || filtroCategoria || filtroDificultad
                      ? 'No se encontraron recetas con los filtros aplicados'
                      : 'No hay recetas de cocina registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                recetas.map((receta) => (
                  <TableRow key={receta.id} className="hover:bg-mostaza/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {receta.imagen && (
                          <img
                            src={receta.imagen}
                            alt={receta.titulo}
                            className="h-10 w-10 rounded object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-marron truncate">{receta.titulo}</p>
                          {receta.descripcion && (
                            <p className="text-xs text-muted-foreground truncate">
                              {receta.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {CATEGORIA_LABEL[receta.categoria || 'otros'] || receta.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge className={DIFICULTAD_BADGE[receta.dificultad] || ''}>
                        {receta.dificultad}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleVisible(receta)}
                        title={receta.visible_en_landing ? 'Ocultar' : 'Mostrar'}
                      >
                        {receta.visible_en_landing ? (
                          <Eye className="h-4 w-4 text-oliva" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleDestacado(receta)}
                        title={receta.destacado ? 'Quitar destacado' : 'Destacar'}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            receta.destacado ? 'fill-mostaza text-mostaza' : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-mostaza/10"
                          onClick={() => router.push(`/admin/recetas-cocina/${receta.id}`)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-mostaza/10"
                          onClick={() => router.push(`/admin/recetas-cocina/${receta.id}/editar`)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-rojo/10"
                          onClick={() => setDeleteId(receta.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-rojo" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La receta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rojo hover:bg-rojo/90 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
