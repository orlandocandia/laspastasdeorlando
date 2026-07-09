'use client'

import { useEffect, useState, useCallback } from 'react'
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
import RecetaForm from './RecetaForm'

interface Receta {
  id: number
  id_producto_terminado: number
  nombre_receta: string
  rendimiento_unidades: number
  activo: boolean
  createdAt: string
  updatedAt: string | null
  productoTerminado: { id: number; codigo: string | null; nombre: string; precio_venta: number }
  detalleRecetas: DetalleReceta[]
}

interface DetalleReceta {
  id: number
  id_receta: number
  id_materia_prima: number | null
  id_insumo: number | null
  cantidad_necesaria: number
  id_unidad: number
  costo_estimado: number
  materiaPrima: { id: number; codigo: string | null; nombre: string; precio_compra_referencia: number } | null
  insumo: { id: number; codigo: string | null; nombre: string; precio_compra_referencia: number } | null
  unidad: { id: number; codigo: string; nombre: string }
}

interface ProductoTerminado {
  id: number
  nombre: string
}

export default function RecetasTable() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroProducto, setFiltroProducto] = useState<string>('')
  const [filtroActivo, setFiltroActivo] = useState<string>('')
  const [productosTerminados, setProductosTerminados] = useState<ProductoTerminado[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filtroEspecial, setFiltroEspecial] = useState<'sin-receta' | 'vacia' | null>(null)
  const [productosSinReceta, setProductosSinReceta] = useState<ProductoTerminado[]>([])

  const fetchRecetas = useCallback(async (paginaOverride?: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', (paginaOverride ?? pagina).toString())
      params.set('limite', '20')
      if (search) params.set('buscar', search)
      if (filtroProducto && filtroProducto !== 'all') params.set('id_producto_terminado', filtroProducto)
      if (filtroActivo && filtroActivo !== 'all') params.set('activo', filtroActivo)
      if (filtroEspecial === 'vacia') params.set('vacia', 'true')

      const res = await fetch(`/api/recetas?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar recetas')
      const data = await res.json()
      setRecetas(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar recetas')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroProducto, filtroActivo, filtroEspecial])

  // Fetch productos sin receta when filtroEspecial === 'sin-receta'
  const fetchProductosSinReceta = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/productos-terminados?sin_receta=true&limite=200&estado=true')
      if (!res.ok) throw new Error('Error al cargar productos sin receta')
      const data = await res.json()
      setProductosSinReceta(data.data || [])
      setTotal((data.data || []).length)
      setTotalPaginas(1)
    } catch {
      toast.error('Error al cargar productos sin receta')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProductosTerminados = useCallback(async () => {
    try {
      const res = await fetch('/api/productos-terminados?limite=200&estado=true')
      if (!res.ok) throw new Error('Error al cargar productos terminados')
      const data = await res.json()
      setProductosTerminados(
        (data.data || []).map((pt: any) => ({
          id: pt.id,
          nombre: pt.nombre,
        }))
      )
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchProductosTerminados()
  }, [fetchProductosTerminados])

  // Read filtro query param from URL on mount (for dashboard alerts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const filtroParam = params.get('filtro')
    if (filtroParam === 'sin-receta' || filtroParam === 'vacia') {
      setFiltroEspecial(filtroParam)
    }
  }, [])

  useEffect(() => {
    if (filtroEspecial === 'sin-receta') {
      fetchProductosSinReceta()
    } else {
      fetchRecetas()
    }
  }, [fetchRecetas, fetchProductosSinReceta, filtroEspecial])

  // When filters change, reset to page 1 and fetch
  useEffect(() => {
    if (pagina !== 1) {
      setPagina(1)
    } else {
      fetchRecetas(1)
    }
  }, [search, filtroProducto, filtroActivo])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/recetas/${deleteId}`, { method: 'DELETE' })
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

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedReceta(null)
    fetchRecetas()
  }

  const openNew = () => {
    setSelectedReceta(null)
    setFormOpen(true)
  }

  const openEdit = (receta: Receta) => {
    setSelectedReceta(receta)
    setFormOpen(true)
  }

  const getCostoEstimado = (receta: Receta) => {
    return receta.detalleRecetas?.reduce((sum, d) => sum + (d.costo_estimado || 0), 0) || 0
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
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
      {/* Banner de filtro especial (desde dashboard) */}
      {filtroEspecial && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-mostaza/30 bg-mostaza/5 p-3">
          <div className="flex items-center gap-2 text-sm text-marron">
            <Badge className="bg-mostaza text-marron">Filtro activo</Badge>
            {filtroEspecial === 'sin-receta'
              ? 'Mostrando productos terminados sin receta asociada'
              : 'Mostrando recetas sin ingredientes cargados'}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFiltroEspecial(null)
              setProductosSinReceta([])
              // Clean URL param
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href)
                url.searchParams.delete('filtro')
                window.history.replaceState({}, '', url.toString())
              }
            }}
            className="text-xs text-muted-foreground hover:text-marron"
          >
            Quitar filtro
          </Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroProducto} onValueChange={setFiltroProducto}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Producto Term." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {productosTerminados.map((pt) => (
                <SelectItem key={pt.id} value={pt.id.toString()}>
                  {pt.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroActivo} onValueChange={setFiltroActivo}>
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
          Nueva Receta
        </Button>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre Receta</TableHead>
                <TableHead>Producto Terminado</TableHead>
                <TableHead className="text-center">Rendimiento</TableHead>
                <TableHead className="text-right">Costo Estimado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtroEspecial === 'sin-receta' ? (
                productosSinReceta.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-oliva">
                      Todos los productos terminados tienen receta asociada
                    </TableCell>
                  </TableRow>
                ) : (
                  productosSinReceta.map((pt) => (
                    <TableRow key={pt.id} className="hover:bg-mostaza/5">
                      <TableCell className="font-medium text-marron">
                        <Badge className="bg-rojo/15 text-rojo hover:bg-rojo/25 mr-2">Sin receta</Badge>
                        {pt.nombre}
                      </TableCell>
                      <TableCell className="text-sm text-marron">{pt.nombre}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">-</TableCell>
                      <TableCell className="text-right text-muted-foreground">-</TableCell>
                      <TableCell>
                        <Badge className="bg-rojo/15 text-rojo hover:bg-rojo/25">Pendiente</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
                          onClick={openNew}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Crear receta
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : recetas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search || filtroProducto || filtroActivo || filtroEspecial === 'vacia'
                      ? 'No se encontraron recetas con los filtros aplicados'
                      : 'No hay recetas registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                recetas.map((receta) => (
                  <TableRow key={receta.id} className="hover:bg-mostaza/5">
                    <TableCell className="font-medium text-marron">
                      {receta.nombre_receta}
                    </TableCell>
                    <TableCell className="text-sm text-marron">
                      {receta.productoTerminado?.nombre || '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {receta.rendimiento_unidades} u.
                    </TableCell>
                    <TableCell className="text-right font-semibold text-marron">
                      {formatCurrency(getCostoEstimado(receta))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          receta.activo
                            ? 'bg-oliva/15 text-oliva hover:bg-oliva/25'
                            : 'bg-rojo/15 text-rojo hover:bg-rojo/25'
                        }
                      >
                        {receta.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-mostaza/10"
                          onClick={() => openEdit(receta)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-rojo/10"
                          onClick={() => setDeleteId(receta.id)}
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
          if (!open) setSelectedReceta(null)
        }}
      >
        <DialogContent className="sm:max-w-7xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedReceta ? 'Editar Receta' : 'Nueva Receta'}
            </DialogTitle>
          </DialogHeader>
          <RecetaForm
            receta={selectedReceta}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setSelectedReceta(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La receta será eliminada permanentemente junto con todos sus ingredientes.
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
