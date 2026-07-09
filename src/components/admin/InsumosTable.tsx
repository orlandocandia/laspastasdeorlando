'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Search, Loader2, ChevronLeft, ChevronRight, PackagePlus } from 'lucide-react'

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import InsumoForm from './InsumoForm'
import { StockAdjustDialog } from './StockAdjustDialog'

interface Insumo {
  id: number
  codigo?: string | null
  nombre: string
  descripcion?: string | null
  id_tipo_insumo: number
  id_unidad_base: number
  stock_actual: number
  stock_minimo: number
  precio_compra_referencia: number
  imagen?: string | null
  estado: boolean
  tipoInsumo: { id: number; nombre: string }
  unidadBase: { id: number; codigo: string; nombre: string }
}

interface TipoInsumo {
  id: number
  nombre: string
}

export default function InsumosTable() {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroStock, setFiltroStock] = useState<string>('')
  const [tiposInsumo, setTiposInsumo] = useState<TipoInsumo[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [stockAdjustItem, setStockAdjustItem] = useState<Insumo | null>(null)
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false)

  // Read stock query param from URL on mount (for dashboard alerts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stockParam = params.get('stock')
    if (stockParam) {
      // Normalize: 'bajo' -> 'stock_bajo' (API accepts sin_stock | stock_bajo)
      const normalized = stockParam === 'bajo' ? 'stock_bajo' : stockParam
      setFiltroStock(normalized)
    }
  }, [])

  const fetchInsumos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (search) params.set('buscar', search)
      if (filtroTipo && filtroTipo !== 'all') params.set('id_tipo_insumo', filtroTipo)
      if (filtroEstado && filtroEstado !== 'all') params.set('estado', filtroEstado)
      if (filtroStock && filtroStock !== 'all') params.set('stock', filtroStock)

      const res = await fetch(`/api/insumos?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar insumos')
      const data = await res.json()
      setInsumos(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar insumos')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroTipo, filtroEstado, filtroStock])

  const fetchTipos = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias?tipo=tipos-insumo')
      if (!res.ok) throw new Error('Error al cargar tipos')
      const data = await res.json()
      setTiposInsumo(Array.isArray(data) ? data : [])
    } catch {
      // silent fail for filter
    }
  }, [])

  useEffect(() => {
    fetchTipos()
  }, [fetchTipos])

  useEffect(() => {
    fetchInsumos()
  }, [fetchInsumos])

  useEffect(() => {
    setPagina(1)
  }, [search, filtroTipo, filtroEstado, filtroStock])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/insumos/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Insumo eliminado')
      fetchInsumos()
    } catch {
      toast.error('Error al eliminar insumo')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedInsumo(null)
    fetchInsumos()
  }

  const openNew = () => {
    setSelectedInsumo(null)
    setFormOpen(true)
  }

  const openEdit = (insumo: Insumo) => {
    setSelectedInsumo(insumo)
    setFormOpen(true)
  }

  if (loading && insumos.length === 0) {
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
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo Insumo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {tiposInsumo.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                  {tipo.nombre}
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
          <Select value={filtroStock} onValueChange={setFiltroStock}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todo el stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el stock</SelectItem>
              <SelectItem value="sin_stock">Sin stock</SelectItem>
              <SelectItem value="stock_bajo">Stock bajo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={openNew}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Insumo
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
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead>Stock Act.</TableHead>
                <TableHead className="hidden md:table-cell">Stock Mín.</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search || filtroTipo || filtroEstado || filtroStock
                      ? 'No se encontraron insumos con los filtros aplicados'
                      : 'No hay insumos cargados'}
                  </TableCell>
                </TableRow>
              ) : (
                insumos.map((ins) => {
                  const sinStock = ins.stock_actual <= 0
                  const stockBajo = ins.stock_actual > 0 && ins.stock_actual <= ins.stock_minimo

                  return (
                    <TableRow key={ins.id} className="hover:bg-mostaza/5">
                      <TableCell>
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                          {ins.imagen ? (
                            <Image
                              src={ins.imagen}
                              alt={ins.nombre}
                              fill
                              loading="lazy"
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              N/A
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ins.codigo || '-'}
                      </TableCell>
                      <TableCell className="font-medium text-marron">
                        <div>{ins.nombre}</div>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          {ins.tipoInsumo?.nombre || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="border-marron/20 text-marron">
                          {ins.tipoInsumo?.nombre || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sinStock ? (
                          <Badge className="bg-rojo/10 text-rojo hover:bg-rojo/20">
                            Sin stock
                          </Badge>
                        ) : stockBajo ? (
                          <Badge className="bg-mostaza/10 text-mostaza hover:bg-mostaza/20">
                            {ins.stock_actual}
                          </Badge>
                        ) : (
                          <Badge className="bg-oliva/10 text-oliva hover:bg-oliva/20">
                            {ins.stock_actual}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {ins.stock_minimo}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          className={
                            ins.estado
                              ? 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                              : 'bg-rojo/10 text-rojo hover:bg-rojo/20'
                          }
                        >
                          {ins.estado ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 hover:bg-oliva/10"
                                  onClick={() => {
                                    setStockAdjustItem(ins)
                                    setStockAdjustOpen(true)
                                  }}
                                >
                                  <PackagePlus className="h-4 w-4 text-oliva" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cargar stock</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-mostaza/10"
                            onClick={() => openEdit(ins)}
                          >
                            <Pencil className="h-4 w-4 text-mostaza" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-rojo/10"
                            onClick={() => setDeleteId(ins.id)}
                          >
                            <Trash2 className="h-4 w-4 text-rojo" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
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
          if (!open) setSelectedInsumo(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
            </DialogTitle>
          </DialogHeader>
          <InsumoForm
            insumo={selectedInsumo}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar insumo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El insumo será eliminado permanentemente del inventario.
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

      {/* Stock Adjust Dialog */}
      <StockAdjustDialog
        open={stockAdjustOpen}
        onClose={() => { setStockAdjustOpen(false); setStockAdjustItem(null) }}
        tipo_item="insumo"
        item_id={stockAdjustItem?.id ?? 0}
        item_nombre={stockAdjustItem?.nombre ?? ''}
        stock_actual={stockAdjustItem?.stock_actual ?? 0}
        stock_minimo={stockAdjustItem?.stock_minimo ?? 0}
        onSuccess={fetchInsumos}
      />
    </div>
  )
}
