'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Pencil, Trash2, Plus, Search, Loader2, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'

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
import VentaForm from './VentaForm'

interface Venta {
  id: number
  id_cliente: number
  id_vendedor: number
  id_forma_pago: number
  id_pedido: number | null
  numero_comprobante: string | null
  fecha_venta: string
  subtotal: number
  iva: number
  total: number
  id_estado: number
  createdAt: string
  updatedAt: string | null
  cliente: { id: number; nombre: string; apellido: string; razon_social: string | null }
  vendedor: { id: number; persona: { nombre: string; apellido: string } }
  formaPago: { id: number; nombre_forma: string }
  pedido: { id: number } | null
  estado: { id: number; nombre_estado: string; entidad_aplicable: string | null }
  detalle: DetalleVenta[]
}

interface DetalleVenta {
  id: number
  id_venta: number
  id_producto_terminado: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  productoTerminado: { id: number; nombre: string; precio_venta: number }
}

interface Cliente {
  id: number
  nombre: string
  apellido: string
  razon_social: string | null
}

interface FormaPago {
  id: number
  nombre_forma: string
}

const ESTADO_BADGE_MAP: Record<string, string> = {
  pendiente: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
  confirmado: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  en_proceso: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  completado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  entregado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  anulado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
  cancelado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
}

function getEstadoBadgeClass(nombreEstado: string): string {
  const key = nombreEstado.toLowerCase().replace(/ /g, '_')
  return ESTADO_BADGE_MAP[key] || 'bg-muted text-muted-foreground'
}

export default function VentasTable() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroCliente, setFiltroCliente] = useState<string>('')
  const [filtroFormaPago, setFiltroFormaPago] = useState<string>('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [estados, setEstados] = useState<{ id: number; nombre_estado: string }[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pedidoVentaOpen, setPedidoVentaOpen] = useState(false)

  const fetchVentas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (search) params.set('buscar', search)
      if (filtroEstado && filtroEstado !== 'all') params.set('id_estado', filtroEstado)
      if (filtroCliente && filtroCliente !== 'all') params.set('id_cliente', filtroCliente)
      if (filtroFormaPago && filtroFormaPago !== 'all') params.set('id_forma_pago', filtroFormaPago)

      const res = await fetch(`/api/ventas?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar ventas')
      const data = await res.json()
      setVentas(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroEstado, filtroCliente, filtroFormaPago])

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch('/api/personas?tipo=cliente&limite=100')
      if (!res.ok) throw new Error('Error al cargar clientes')
      const data = await res.json()
      setClientes(data.personas || [])
    } catch {
      // silent
    }
  }, [])

  const fetchFormasPago = useCallback(async () => {
    try {
      const res = await fetch('/api/formas-pago')
      if (!res.ok) throw new Error('Error al cargar formas de pago')
      const data = await res.json()
      setFormasPago(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [])

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch('/api/estados-generales?entidad_aplicable=venta')
      if (!res.ok) throw new Error('Error al cargar estados')
      const data = await res.json()
      setEstados(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchClientes()
    fetchFormasPago()
    fetchEstados()
  }, [fetchClientes, fetchFormasPago, fetchEstados])

  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  useEffect(() => {
    setPagina(1)
  }, [search, filtroEstado, filtroCliente, filtroFormaPago])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/ventas/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Venta eliminada')
      fetchVentas()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar venta')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedVenta(null)
    fetchVentas()
  }

  const openNew = () => {
    setSelectedVenta(null)
    setFormOpen(true)
  }

  const openNewFromPedido = () => {
    setSelectedVenta(null)
    setPedidoVentaOpen(true)
  }

  const openEdit = (venta: Venta) => {
    setSelectedVenta(venta)
    setFormOpen(true)
  }

  const getClienteName = (venta: Venta) => {
    if (venta.cliente?.razon_social) return venta.cliente.razon_social
    return `${venta.cliente?.nombre || ''} ${venta.cliente?.apellido || ''}`.trim()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  if (loading && ventas.length === 0) {
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
              placeholder="Buscar por comprobante..."
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
          <Select value={filtroFormaPago} onValueChange={setFiltroFormaPago}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Forma Pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {formasPago.map((fp) => (
                <SelectItem key={fp.id} value={fp.id.toString()}>
                  {fp.nombre_forma}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroCliente} onValueChange={setFiltroCliente}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clientes.map((cli) => (
                <SelectItem key={cli.id} value={cli.id.toString()}>
                  {cli.razon_social || `${cli.nombre} ${cli.apellido}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openNewFromPedido}
            variant="outline"
            className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Vender desde Pedido
          </Button>
          <Button
            onClick={openNew}
            className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Comprobante</TableHead>
                <TableHead className="hidden lg:table-cell">Forma Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search || filtroEstado || filtroCliente || filtroFormaPago
                      ? 'No se encontraron ventas con los filtros aplicados'
                      : 'No hay ventas registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                ventas.map((venta) => (
                  <TableRow key={venta.id} className="hover:bg-mostaza/5">
                    <TableCell className="text-sm text-marron whitespace-nowrap">
                      {format(new Date(venta.fecha_venta), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      {getClienteName(venta)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {venta.numero_comprobante || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {venta.formaPago?.nombre_forma || '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-marron">
                      {formatCurrency(venta.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadgeClass(venta.estado?.nombre_estado || '')}>
                        {venta.estado?.nombre_estado || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-mostaza/10"
                          onClick={() => openEdit(venta)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-rojo/10"
                          onClick={() => setDeleteId(venta.id)}
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

      {/* Create/Edit Dialog (direct new venta) */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedVenta(null)
        }}
      >
        <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedVenta ? 'Editar Venta' : 'Nueva Venta'}
            </DialogTitle>
          </DialogHeader>
          <VentaForm
            venta={selectedVenta}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setSelectedVenta(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Vender desde Pedido Dialog */}
      <Dialog
        open={pedidoVentaOpen}
        onOpenChange={(open) => {
          setPedidoVentaOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">Vender desde Pedido</DialogTitle>
          </DialogHeader>
          <VentaForm
            fromPedido={true}
            onSuccess={() => {
              setPedidoVentaOpen(false)
              fetchVentas()
            }}
            onCancel={() => setPedidoVentaOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La venta será eliminada permanentemente.
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
