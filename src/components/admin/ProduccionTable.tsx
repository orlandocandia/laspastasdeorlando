'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, CheckCircle2, Eye } from 'lucide-react'

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
import ProduccionForm from './ProduccionForm'
import ProduccionPrintButton from './ProduccionPrintButton'
import type { OrdenProduccionData } from '@/components/print/OrdenProduccionPDFDocument'

interface Produccion {
  id: number
  id_receta: number
  id_supervisor: number | null
  cantidad_producida: number
  fecha_produccion: string
  costo_total_materias_primas: number
  costo_total_insumos: number
  costo_total: number
  id_estado: number
  observaciones: string | null
  createdAt: string
  updatedAt: string | null
  receta: {
    id: number
    productoTerminado: { id: number; codigo: string | null; nombre: string; precio_venta: number }
  }
  supervisor: { id: number; nombre: string; apellido: string; razon_social: string | null } | null
  estado: { id: number; nombre_estado: string; entidad_aplicable: string | null }
  detalleConsumos: DetalleProduccionConsumo[]
  detalleGenerados: DetalleProduccionGenerado[]
}

interface DetalleProduccionConsumo {
  id: number
  id_materia_prima: number | null
  id_insumo: number | null
  cantidad_consumida: number
  id_unidad: number
  costo_unitario: number
  costo_total: number
  materiaPrima: { id: number; nombre: string; codigo: string | null } | null
  insumo: { id: number; nombre: string; codigo: string | null } | null
  unidad: { id: number; nombre: string; codigo: string }
}

interface DetalleProduccionGenerado {
  id: number
  id_producto_terminado: number
  cantidad_generada: number
  costo_unitario: number
  costo_total: number
  productoTerminado: { id: number; codigo: string | null; nombre: string; precio_venta: number }
}

interface Receta {
  id: number
  nombre: string
  productoTerminado: { id: number; nombre: string; codigo: string | null }
}

interface EstadoGeneral {
  id: number
  nombre_estado: string
  entidad_aplicable: string | null
}

const ESTADO_BADGE_MAP: Record<string, string> = {
  planificado: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
  en_curso: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  completado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  cancelado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
}

function getEstadoBadgeClass(nombreEstado: string): string {
  const key = nombreEstado.toLowerCase().replace(/ /g, '_')
  return ESTADO_BADGE_MAP[key] || 'bg-muted text-muted-foreground'
}

// Transform Produccion record to OrdenProduccionData for PDF export
function toProduccionData(prod: Produccion): OrdenProduccionData {
  return {
    id: prod.id,
    producto: prod.receta?.productoTerminado?.nombre || '-',
    cantidad_producida: prod.cantidad_producida,
    fecha_produccion: prod.fecha_produccion,
    estado: prod.estado?.nombre_estado || '-',
    observaciones: prod.observaciones,
    supervisor: prod.supervisor
      ? (prod.supervisor.razon_social || `${prod.supervisor.nombre} ${prod.supervisor.apellido}`.trim())
      : null,
    receta_nombre: null,
    consumos: (prod.detalleConsumos || []).map((d) => ({
      tipo: d.id_materia_prima ? 'materia_prima' as const : 'insumo' as const,
      nombre: d.materiaPrima?.nombre || d.insumo?.nombre || '-',
      cantidad: d.cantidad_consumida,
      unidad: d.unidad?.nombre || '-',
      costo_unitario: d.costo_unitario,
      costo_total: d.costo_total,
    })),
    generados: (prod.detalleGenerados || []).map((d) => ({
      nombre: d.productoTerminado?.nombre || '-',
      cantidad: d.cantidad_generada,
      costo_unitario: d.costo_unitario,
      costo_total: d.costo_total,
    })),
    costo_materias_primas: prod.costo_total_materias_primas,
    costo_insumos: prod.costo_total_insumos,
    costo_total: prod.costo_total,
  }
}

export default function ProduccionTable() {
  const [producciones, setProducciones] = useState<Produccion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroReceta, setFiltroReceta] = useState<string>('')
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [estados, setEstados] = useState<EstadoGeneral[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [completarId, setCompletarId] = useState<number | null>(null)
  const [completando, setCompletando] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [selectedProduccion, setSelectedProduccion] = useState<Produccion | null>(null)
  const [filtroEspecial, setFiltroEspecial] = useState<'productos-sin-stock' | null>(null)
  const [productosSinStock, setProductosSinStock] = useState<{ id: number; nombre: string; stock_actual: number; stock_minimo: number }[]>([])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  const fetchProducciones = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (filtroEstado && filtroEstado !== 'all') params.set('id_estado', filtroEstado)
      if (filtroReceta && filtroReceta !== 'all') params.set('id_receta', filtroReceta)

      const res = await fetch(`/api/produccion?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar producciones')
      const data = await res.json()
      setProducciones(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar producciones')
    } finally {
      setLoading(false)
    }
  }, [pagina, filtroEstado, filtroReceta])

  const fetchRecetas = useCallback(async () => {
    try {
      const res = await fetch('/api/recetas?activo=true&limite=100')
      if (!res.ok) throw new Error('Error al cargar recetas')
      const data = await res.json()
      setRecetas(data.data || [])
    } catch {
      // silent
    }
  }, [])

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch('/api/estados-generales?entidad_aplicable=produccion')
      if (!res.ok) throw new Error('Error al cargar estados')
      const data = await res.json()
      setEstados(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchRecetas()
    fetchEstados()
  }, [fetchRecetas, fetchEstados])

  useEffect(() => {
    fetchProducciones()
  }, [fetchProducciones])

  useEffect(() => {
    setPagina(1)
  }, [filtroEstado, filtroReceta])

  // Read query params from URL on mount (for dashboard alerts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const estadoParam = params.get('estado')
    const productosSinStockFlag = params.get('productos-sin-stock')
    if (productosSinStockFlag !== null) {
      setFiltroEspecial('productos-sin-stock')
      // Fetch productos sin stock
      fetch('/api/productos-terminados?stock=sin_stock&limite=200&estado=true')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setProductosSinStock(data.data || []))
        .catch(() => {})
    } else if (estadoParam) {
      // Translate estado name to id_estado using the loaded estados
      // Fetch estados first if not loaded yet
      fetch('/api/estados-generales?entidad_aplicable=produccion')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(estadosData => {
          let nombresBuscados = [estadoParam]
          if (estadoParam === 'pendiente') {
            nombresBuscados = ['planificado', 'en_curso']
          }
          const match = (Array.isArray(estadosData) ? estadosData : []).find(
            (e: { nombre_estado: string }) => nombresBuscados.includes(e.nombre_estado.toLowerCase())
          )
          if (match) setFiltroEstado(match.id.toString())
        })
        .catch(() => {})
    }
  }, [])

  const handleCompletar = async () => {
    if (!completarId) return
    setCompletando(true)
    try {
      const res = await fetch(`/api/produccion/${completarId}/completar`, { method: 'PUT' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al completar producción')
      }
      toast.success('Producción completada', {
        description: 'Se actualizó el stock correctamente',
      })
      fetchProducciones()
    } catch (error: any) {
      toast.error(error.message || 'Error al completar producción')
    } finally {
      setCompletando(false)
      setCompletarId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    fetchProducciones()
  }

  const openNew = () => {
    setFormOpen(true)
  }

  const openDetalle = (prod: Produccion) => {
    setSelectedProduccion(prod)
    setDetalleOpen(true)
  }

  const canCompletar = (estado: string) => {
    const key = estado.toLowerCase().replace(/ /g, '_')
    return key === 'planificado' || key === 'en_curso'
  }

  const getRecetaNombre = (prod: Produccion) => {
    return prod.receta?.productoTerminado?.nombre || '-'
  }

  const getProductoTerminadoNombre = (prod: Produccion) => {
    return prod.receta?.productoTerminado?.nombre || '-'
  }

  if (loading && producciones.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Banner de productos sin stock (desde dashboard) */}
      {filtroEspecial === 'productos-sin-stock' && (
        <div className="rounded-lg border border-rojo/30 bg-rojo/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-marron">
              <Badge className="bg-rojo text-crema">Filtro activo</Badge>
              Mostrando productos terminados sin stock - produci necesarios
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroEspecial(null)
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href)
                  url.searchParams.delete('productos-sin-stock')
                  window.history.replaceState({}, '', url.toString())
                }
              }}
              className="text-xs text-muted-foreground hover:text-marron"
            >
              Quitar filtro
            </Button>
          </div>
          {productosSinStock.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border border-rojo/20 bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Stock Actual</TableHead>
                    <TableHead className="text-center">Stock Minimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosSinStock.map(pt => (
                    <TableRow key={pt.id}>
                      <TableCell className="font-medium text-marron text-sm">{pt.nombre}</TableCell>
                      <TableCell className="text-center"><Badge className="bg-rojo/15 text-rojo">{pt.stock_actual}</Badge></TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{pt.stock_minimo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Usa el boton <strong className="text-marron">Nueva Produccion</strong> para registrar la produccion de estos productos.
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {estados.map((est) => (
                <SelectItem key={est.id} value={est.id.toString()}>
                  {est.nombre_estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroReceta} onValueChange={setFiltroReceta}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Receta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {recetas.map((rec) => (
                <SelectItem key={rec.id} value={rec.id.toString()}>
                  {rec.productoTerminado?.nombre || `Receta #${rec.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={openNew}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Producción
        </Button>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Receta</TableHead>
                <TableHead className="hidden md:table-cell">Producto Terminado</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Costo Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {producciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {filtroEstado || filtroReceta
                      ? 'No se encontraron producciones con los filtros aplicados'
                      : 'No hay producciones registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                producciones.map((prod) => (
                  <TableRow key={prod.id} className="hover:bg-mostaza/5">
                    <TableCell className="text-sm text-marron whitespace-nowrap">
                      {format(new Date(prod.fecha_produccion), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      {getRecetaNombre(prod)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {getProductoTerminadoNombre(prod)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-marron">
                      {prod.cantidad_producida}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-marron hidden sm:table-cell">
                      {formatCurrency(prod.costo_total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadgeClass(prod.estado?.nombre_estado || '')}>
                        {prod.estado?.nombre_estado || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canCompletar(prod.estado?.nombre_estado || '') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-oliva/10"
                            onClick={() => setCompletarId(prod.id)}
                            title="Completar producción"
                          >
                            <CheckCircle2 className="h-4 w-4 text-oliva" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-mostaza/10"
                          onClick={() => openDetalle(prod)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4 text-mostaza" />
                        </Button>
                        <ProduccionPrintButton orden={toProduccionData(prod)} />
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

      {/* Create Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">Nueva Producción</DialogTitle>
          </DialogHeader>
          <ProduccionForm
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detalleOpen}
        onOpenChange={(open) => {
          setDetalleOpen(open)
          if (!open) setSelectedProduccion(null)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron flex items-center justify-between gap-3 pr-8">
              <span>Detalle Producción #{selectedProduccion?.id}</span>
              {selectedProduccion && (
                <ProduccionPrintButton orden={toProduccionData(selectedProduccion)} variant="full" />
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedProduccion && (
            <div className="space-y-6">
              {/* Info header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 border border-marron/10">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-medium text-marron">
                    {format(new Date(selectedProduccion.fecha_produccion), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Producto</p>
                  <p className="text-sm font-medium text-marron">
                    {selectedProduccion.receta?.productoTerminado?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad</p>
                  <p className="text-sm font-medium text-marron">
                    {selectedProduccion.cantidad_producida}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge className={getEstadoBadgeClass(selectedProduccion.estado?.nombre_estado || '')}>
                    {selectedProduccion.estado?.nombre_estado || '-'}
                  </Badge>
                </div>
              </div>

              {selectedProduccion.supervisor && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-marron">Supervisor:</span>{' '}
                  {selectedProduccion.supervisor.razon_social ||
                    `${selectedProduccion.supervisor.nombre} ${selectedProduccion.supervisor.apellido}`}
                </div>
              )}

              {selectedProduccion.observaciones && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-marron">Observaciones:</span>{' '}
                  {selectedProduccion.observaciones}
                </div>
              )}

              {/* Consumos */}
              <div>
                <h3 className="text-sm font-semibold text-marron mb-2">
                  Materias Primas e Insumos Consumidos
                </h3>
                {selectedProduccion.detalleConsumos && selectedProduccion.detalleConsumos.length > 0 ? (
                  <div className="rounded-lg border border-marron/10 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 text-muted-foreground font-medium">Tipo</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Nombre</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Cantidad</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Unidad</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Costo Unit.</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Costo Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduccion.detalleConsumos.map((det) => (
                          <tr key={det.id} className="border-t border-marron/5">
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className={
                                  det.id_materia_prima
                                    ? 'border-mostaza/30 text-mostaza'
                                    : 'border-blue-300 text-blue-600'
                                }
                              >
                                {det.id_materia_prima ? 'MP' : 'Insumo'}
                              </Badge>
                            </td>
                            <td className="p-2 text-marron">
                              {det.materiaPrima?.nombre || det.insumo?.nombre || '-'}
                            </td>
                            <td className="p-2 text-right">{det.cantidad_consumida}</td>
                            <td className="p-2 text-muted-foreground">{det.unidad?.nombre || '-'}</td>
                            <td className="p-2 text-right">{formatCurrency(det.costo_unitario)}</td>
                            <td className="p-2 text-right font-medium text-marron">
                              {formatCurrency(det.costo_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay consumos registrados</p>
                )}
              </div>

              {/* Generados */}
              <div>
                <h3 className="text-sm font-semibold text-marron mb-2">
                  Productos Terminados Generados
                </h3>
                {selectedProduccion.detalleGenerados && selectedProduccion.detalleGenerados.length > 0 ? (
                  <div className="rounded-lg border border-marron/10 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 text-muted-foreground font-medium">Producto</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Cantidad</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Costo Unit.</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Costo Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduccion.detalleGenerados.map((det) => (
                          <tr key={det.id} className="border-t border-marron/5">
                            <td className="p-2 text-marron">
                              {det.productoTerminado?.nombre || '-'}
                            </td>
                            <td className="p-2 text-right">{det.cantidad_generada}</td>
                            <td className="p-2 text-right">{formatCurrency(det.costo_unitario)}</td>
                            <td className="p-2 text-right font-medium text-marron">
                              {formatCurrency(det.costo_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay productos generados registrados</p>
                )}
              </div>

              {/* Cost summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo Materias Primas</span>
                    <span className="font-medium text-marron">
                      {formatCurrency(selectedProduccion.costo_total_materias_primas)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo Insumos</span>
                    <span className="font-medium text-marron">
                      {formatCurrency(selectedProduccion.costo_total_insumos)}
                    </span>
                  </div>
                  <div className="border-t border-marron/10 pt-1">
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-marron">Costo Total</span>
                      <span className="text-marron">{formatCurrency(selectedProduccion.costo_total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Completar Confirmation */}
      <AlertDialog open={!!completarId} onOpenChange={(open) => !open && setCompletarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Completar producción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se descontará el stock de materias primas e insumos, y se agregará el stock de productos terminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompletar}
              disabled={completando}
              className="bg-oliva hover:bg-oliva/90 text-white"
            >
              {completando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completando...
                </>
              ) : (
                'Completar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
