'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import MateriaPrimaForm from './MateriaPrimaForm'

interface MateriaPrima {
  id: number
  codigo?: string | null
  nombre: string
  descripcion?: string | null
  id_categoria: number
  id_unidad_base: number
  stock_actual: number
  stock_minimo: number
  precio_compra_referencia: number
  imagen?: string | null
  estado: boolean
  categoria: { id: number; nombre: string }
  unidadBase: { id: number; codigo: string; nombre: string }
}

interface Categoria {
  id: number
  nombre: string
}

export default function MateriasPrimasTable() {
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedMateriaPrima, setSelectedMateriaPrima] = useState<MateriaPrima | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchMateriasPrimas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (search) params.set('buscar', search)
      if (filtroCategoria && filtroCategoria !== 'all') params.set('id_categoria', filtroCategoria)
      if (filtroEstado && filtroEstado !== 'all') params.set('estado', filtroEstado)

      const res = await fetch(`/api/materias-primas?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar materias primas')
      const data = await res.json()
      setMateriasPrimas(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar materias primas')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroCategoria, filtroEstado])

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias?tipo=materias-primas')
      if (!res.ok) throw new Error('Error al cargar categorías')
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data : [])
    } catch {
      // silent fail for filter
    }
  }, [])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  useEffect(() => {
    fetchMateriasPrimas()
  }, [fetchMateriasPrimas])

  // Reset page when filters change
  useEffect(() => {
    setPagina(1)
  }, [search, filtroCategoria, filtroEstado])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/materias-primas/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Materia prima eliminada')
      fetchMateriasPrimas()
    } catch {
      toast.error('Error al eliminar materia prima')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedMateriaPrima(null)
    fetchMateriasPrimas()
  }

  const openNew = () => {
    setSelectedMateriaPrima(null)
    setFormOpen(true)
  }

  const openEdit = (mp: MateriaPrima) => {
    setSelectedMateriaPrima(mp)
    setFormOpen(true)
  }

  if (loading && materiasPrimas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={openNew}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Materia Prima
        </Button>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Foto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead>Stock Act.</TableHead>
                <TableHead className="hidden md:table-cell">Stock Mín.</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiasPrimas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search || filtroCategoria || filtroEstado
                      ? 'No se encontraron materias primas con los filtros aplicados'
                      : 'No hay materias primas cargadas'}
                  </TableCell>
                </TableRow>
              ) : (
                materiasPrimas.map((mp) => (
                  <TableRow key={mp.id} className="hover:bg-mostaza/5">
                    <TableCell>
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                        {mp.imagen ? (
                          <Image
                            src={mp.imagen}
                            alt={mp.nombre}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            N/A
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {mp.codigo || '-'}
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      <div>{mp.nombre}</div>
                      <div className="sm:hidden text-xs text-muted-foreground">
                        {mp.categoria?.nombre || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="border-marron/20 text-marron">
                        {mp.categoria?.nombre || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {mp.stock_actual <= mp.stock_minimo ? (
                        <Badge className="bg-rojo/10 text-rojo hover:bg-rojo/20">
                          {mp.stock_actual}
                        </Badge>
                      ) : (
                        <span className="text-marron">{mp.stock_actual}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {mp.stock_minimo}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        className={
                          mp.estado
                            ? 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                            : 'bg-rojo/10 text-rojo hover:bg-rojo/20'
                        }
                      >
                        {mp.estado ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-mostaza/10"
                          onClick={() => openEdit(mp)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rojo/10"
                          onClick={() => setDeleteId(mp.id)}
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

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} registro{total !== 1 ? 's' : ''} — Página {pagina} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedMateriaPrima(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedMateriaPrima ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
            </DialogTitle>
          </DialogHeader>
          <MateriaPrimaForm
            materiaPrima={selectedMateriaPrima}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar materia prima?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La materia prima será eliminada permanentemente del inventario.
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
