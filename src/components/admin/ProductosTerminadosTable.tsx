'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Search, Loader2, ChevronLeft, ChevronRight, Eye, EyeOff, Star, Tag, Barcode, PackagePlus } from 'lucide-react'

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
import ProductoTerminadoForm from './ProductoTerminadoForm'
import { EtiquetaProducto } from '@/components/admin/EtiquetaProducto'
import { StockAdjustDialog } from './StockAdjustDialog'
import { StockInitialLoadDialog } from './StockInitialLoadDialog'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

interface ProductoTerminado {
  id: number
  codigo?: string | null
  nombre: string
  descripcion?: string | null
  codigo_barras?: string | null
  id_categoria: number
  tipo_harina?: string | null
  seccion?: string | null
  peso_unitario_aprox: number
  unidades?: number | null
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  destacado: boolean
  orden: number
  visible_en_landing: boolean
  imagen?: string | null
  estado: boolean
  categoria: { id: number; nombre: string; seccion?: string | null }
}

interface Categoria {
  id: number
  nombre: string
}

export default function ProductosTerminadosTable() {
  const [productos, setProductos] = useState<ProductoTerminado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedProducto, setSelectedProducto] = useState<ProductoTerminado | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [productoEtiqueta, setProductoEtiqueta] = useState<{id: number, nombre: string, codigo_barras: string | null, codigo: string | null, precio_venta: number, peso_unitario_aprox: number, categoria?: {nombre: string} | null} | null>(null)
  const [showEtiqueta, setShowEtiqueta] = useState(false)
  const [filtroStock, setFiltroStock] = useState<string>('')
  const [stockAdjustItem, setStockAdjustItem] = useState<ProductoTerminado | null>(null)
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false)
  const [stockInitialOpen, setStockInitialOpen] = useState(false)
  const [costData, setCostData] = useState<Record<number, { costo_produccion: number; margen: number; margen_porcentaje: number; tiene_receta: boolean }> >({})

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (search) params.set('buscar', search)
      if (filtroCategoria && filtroCategoria !== 'all') params.set('id_categoria', filtroCategoria)
      if (filtroEstado && filtroEstado !== 'all') params.set('estado', filtroEstado)
      if (filtroStock && filtroStock !== 'all') params.set('stock', filtroStock)

      const res = await fetch(`/api/productos-terminados?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar productos terminados')
      const data = await res.json()
      setProductos(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)

      // Fetch cost data
      try {
        const costRes = await fetch('/api/productos-terminados/costos')
        if (costRes.ok) {
          const costJson = await costRes.json()
          const costMap: Record<number, any> = {}
          for (const item of (costJson.data || [])) {
            costMap[item.id] = item
          }
          setCostData(costMap)
        }
      } catch {
        // silent fail for cost data
      }
    } catch {
      toast.error('Error al cargar productos terminados')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroCategoria, filtroEstado, filtroStock])

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias?tipo=productos-terminados')
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
    fetchProductos()
  }, [fetchProductos])

  useEffect(() => {
    setPagina(1)
  }, [search, filtroCategoria, filtroEstado, filtroStock])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stockParam = params.get('stock')
    if (stockParam) setFiltroStock(stockParam)
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/productos-terminados/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al desactivar')
      toast.success('Producto terminado desactivado')
      fetchProductos()
    } catch {
      toast.error('Error al desactivar producto terminado')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedProducto(null)
    fetchProductos()
  }

  const openNew = () => {
    setSelectedProducto(null)
    setFormOpen(true)
  }

  const openEdit = (producto: ProductoTerminado) => {
    setSelectedProducto(producto)
    setFormOpen(true)
  }

  if (loading && productos.length === 0) {
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
          <Select value={filtroStock} onValueChange={setFiltroStock}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el stock</SelectItem>
              <SelectItem value="sin_stock">Sin stock</SelectItem>
              <SelectItem value="stock_bajo">Stock bajo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setStockInitialOpen(true)}
            variant="outline"
            className="border-oliva text-oliva hover:bg-oliva/10 font-semibold"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Cargar Stock
          </Button>
          <Button
            onClick={openNew}
            className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Foto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="hidden lg:table-cell">Código Barras</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead className="hidden md:table-cell">Harina</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="hidden lg:table-cell">Margen</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell">Landing</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    {search || filtroCategoria || filtroEstado || filtroStock
                      ? 'No se encontraron productos con los filtros aplicados'
                      : 'No hay productos terminados cargados'}
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((pt) => {
                  const stockCritico = pt.stock_actual > 0 && pt.stock_actual <= pt.stock_minimo
                  const sinStock = pt.stock_actual <= 0

                  return (
                    <TableRow key={pt.id} className="hover:bg-mostaza/5">
                      <TableCell>
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                          {pt.imagen ? (
                            <Image
                              src={pt.imagen}
                              alt={pt.nombre}
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
                        {pt.codigo || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                        {pt.codigo_barras ? (
                          <div className="flex items-center gap-1.5">
                            <Barcode className="h-3.5 w-3.5 text-mostaza" />
                            <span>{pt.codigo_barras}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-marron">
                        <div className="flex items-center gap-1">
                          {pt.destacado && (
                            <Star className="h-3 w-3 text-mostaza fill-mostaza" />
                          )}
                          <span>{pt.nombre}</span>
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          {pt.categoria?.nombre || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="border-marron/20 text-marron">
                          {pt.categoria?.nombre || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pt.tipo_harina ? (
                          <Badge
                            className={
                              pt.tipo_harina === 'sin_gluten'
                                ? 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                                : pt.tipo_harina === 'integral'
                                ? 'bg-mostaza/10 text-mostaza hover:bg-mostaza/20'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }
                          >
                            {pt.tipo_harina === 'con_gluten' ? 'Con Gluten' : pt.tipo_harina === 'integral' ? 'Integral' : 'Sin Gluten'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(pt.precio_venta)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {costData[pt.id] ? (
                          <div className="text-xs">
                            <span className={`font-bold ${
                              costData[pt.id].margen_porcentaje > 50 ? 'text-oliva' :
                              costData[pt.id].margen_porcentaje >= 30 ? 'text-mostaza' : 'text-rojo'
                            }`}>
                              {costData[pt.id].margen_porcentaje.toFixed(0)}%
                            </span>
                            {!costData[pt.id].tiene_receta && (
                              <span className="text-muted-foreground ml-1">—</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            sinStock
                              ? 'bg-rojo/10 text-rojo hover:bg-rojo/20'
                              : stockCritico
                              ? 'bg-mostaza/10 text-mostaza hover:bg-mostaza/20'
                              : 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                          }
                        >
                          {sinStock ? 'Sin stock' : `${pt.stock_actual} u.`}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pt.visible_en_landing ? (
                          <Eye className="h-4 w-4 text-oliva" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          className={
                            pt.estado
                              ? 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                              : 'bg-rojo/10 text-rojo hover:bg-rojo/20'
                          }
                        >
                          {pt.estado ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-oliva/10"
                            title="Cargar stock"
                            onClick={() => {
                              setStockAdjustItem(pt)
                              setStockAdjustOpen(true)
                            }}
                          >
                            <PackagePlus className="h-4 w-4 text-oliva" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-mostaza/10"
                            title="Imprimir etiqueta"
                            onClick={() => {
                              setProductoEtiqueta(pt)
                              setShowEtiqueta(true)
                            }}
                          >
                            <Tag className="h-4 w-4 text-mostaza" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-mostaza/10"
                            onClick={() => openEdit(pt)}
                          >
                            <Pencil className="h-4 w-4 text-mostaza" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-rojo/10"
                            onClick={() => setDeleteId(pt.id)}
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
          if (!open) setSelectedProducto(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedProducto ? 'Editar Producto Terminado' : 'Nuevo Producto Terminado'}
            </DialogTitle>
          </DialogHeader>
          <ProductoTerminadoForm
            productoTerminado={selectedProducto}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar producto terminado?</AlertDialogTitle>
            <AlertDialogDescription>
              El producto será marcado como inactivo. Podrás reactivarlo desde el filtro de estado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rojo hover:bg-rojo/90 text-white"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Label Dialog */}
      <EtiquetaProducto
        producto={productoEtiqueta}
        open={showEtiqueta}
        onClose={() => { setShowEtiqueta(false); setProductoEtiqueta(null) }}
      />

      {/* Stock Adjust Dialog */}
      <StockAdjustDialog
        open={stockAdjustOpen}
        onClose={() => { setStockAdjustOpen(false); setStockAdjustItem(null) }}
        tipo_item="producto_terminado"
        item_id={stockAdjustItem?.id ?? 0}
        item_nombre={stockAdjustItem?.nombre ?? ''}
        stock_actual={stockAdjustItem?.stock_actual ?? 0}
        stock_minimo={stockAdjustItem?.stock_minimo ?? 0}
        onSuccess={fetchProductos}
      />

      {/* Stock Initial Load Dialog */}
      <StockInitialLoadDialog
        open={stockInitialOpen}
        onClose={() => setStockInitialOpen(false)}
        onSuccess={fetchProductos}
      />
    </div>
  )
}
