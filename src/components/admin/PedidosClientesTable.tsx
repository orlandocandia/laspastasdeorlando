'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
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
import PedidoClienteForm from './PedidoClienteForm'

interface PedidoCliente {
  id: number
  id_cliente: number
  fecha_pedido: string
  fecha_entrega_solicitada: string
  fecha_entrega_real: string | null
  subtotal: number
  total: number
  senia: number
  id_estado: number
  observaciones: string | null
  createdAt: string
  updatedAt: string | null
  cliente: { id: number; nombre: string; apellido: string; razon_social: string | null }
  estado: { id: number; nombre_estado: string; entidad_aplicable: string | null }
  detalle: DetallePedidoCliente[]
}

interface DetallePedidoCliente {
  id: number
  id_pedido: number
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

const ESTADO_BADGE_MAP: Record<string, string> = {
  pendiente: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
  confirmado: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  en_proceso: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  en_produccion: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  listo_para_entregar: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  completado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  recibido: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  entregado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  anulado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
  expirado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
  cancelado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
}

function getEstadoBadgeClass(nombreEstado: string): string {
  const key = nombreEstado.toLowerCase().replace(/ /g, '_')
  return ESTADO_BADGE_MAP[key] || 'bg-muted text-muted-foreground'
}

export default function PedidosClientesTable() {
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroCliente, setFiltroCliente] = useState<string>('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [estados, setEstados] = useState<{ id: number; nombre_estado: string }[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedPedido, setSelectedPedido] = useState<PedidoCliente | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (search) params.set('buscar', search)
      if (filtroEstado && filtroEstado !== 'all') params.set('id_estado', filtroEstado)
      if (filtroCliente && filtroCliente !== 'all') params.set('id_cliente', filtroCliente)

      const res = await fetch(`/api/pedidos-clientes?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar pedidos')
      const data = await res.json()
      setPedidos(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar pedidos de clientes')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroEstado, filtroCliente])

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

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch('/api/estados-generales?entidad_aplicable=pedido_cliente')
      if (!res.ok) throw new Error('Error al cargar estados')
      const data = await res.json()
      setEstados(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchClientes()
    fetchEstados()
  }, [fetchClientes, fetchEstados])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  useEffect(() => {
    setPagina(1)
  }, [search, filtroEstado, filtroCliente])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/pedidos-clientes/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Pedido eliminado')
      fetchPedidos()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar pedido')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedPedido(null)
    fetchPedidos()
  }

  const openNew = () => {
    setSelectedPedido(null)
    setFormOpen(true)
  }

  const openEdit = (pedido: PedidoCliente) => {
    setSelectedPedido(pedido)
    setFormOpen(true)
  }

  const getClienteName = (pedido: PedidoCliente) => {
    if (pedido.cliente?.razon_social) return pedido.cliente.razon_social
    return `${pedido.cliente?.nombre || ''} ${pedido.cliente?.apellido || ''}`.trim()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  if (loading && pedidos.length === 0) {
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
              placeholder="Buscar por cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-48">
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
        <Button
          onClick={openNew}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pedido
        </Button>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Entrega Solicitada</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Seña</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search || filtroEstado || filtroCliente
                      ? 'No se encontraron pedidos con los filtros aplicados'
                      : 'No hay pedidos de clientes registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                pedidos.map((pedido) => (
                  <TableRow key={pedido.id} className="hover:bg-mostaza/5">
                    <TableCell className="text-sm text-marron whitespace-nowrap">
                      {format(new Date(pedido.fecha_pedido), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      {getClienteName(pedido)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {pedido.fecha_entrega_solicitada
                        ? format(new Date(pedido.fecha_entrega_solicitada), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-marron">
                      {formatCurrency(pedido.total)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
                      {pedido.senia > 0 ? formatCurrency(pedido.senia) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadgeClass(pedido.estado?.nombre_estado || '')}>
                        {pedido.estado?.nombre_estado || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-mostaza/10"
                          onClick={() => openEdit(pedido)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-rojo/10"
                          onClick={() => setDeleteId(pedido.id)}
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
          if (!open) setSelectedPedido(null)
        }}
      >
        <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedPedido ? 'Editar Pedido de Cliente' : 'Nuevo Pedido de Cliente'}
            </DialogTitle>
          </DialogHeader>
          <PedidoClienteForm
            pedido={selectedPedido}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setSelectedPedido(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido de cliente será eliminado permanentemente.
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
