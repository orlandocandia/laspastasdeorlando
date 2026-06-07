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
import ReservaClienteForm from './ReservaClienteForm'

interface ReservaCliente {
  id: number
  id_cliente: number
  id_pedido: number | null
  fecha_reserva: string
  fecha_validez_hasta: string
  id_producto_terminado: number
  cantidad_reservada: number
  cantidad_confirmada: number
  senia: number
  id_estado: number
  createdAt: string
  updatedAt: string | null
  cliente: { id: number; nombre: string; apellido: string; razon_social: string | null }
  productoTerminado: { id: number; nombre: string; precio_venta: number }
  pedido: { id: number } | null
  estado: { id: number; nombre_estado: string; entidad_aplicable: string | null }
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

export default function ReservasClientesTable() {
  const [reservas, setReservas] = useState<ReservaCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroCliente, setFiltroCliente] = useState<string>('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [estados, setEstados] = useState<{ id: number; nombre_estado: string }[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedReserva, setSelectedReserva] = useState<ReservaCliente | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchReservas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (search) params.set('buscar', search)
      if (filtroEstado && filtroEstado !== 'all') params.set('id_estado', filtroEstado)
      if (filtroCliente && filtroCliente !== 'all') params.set('id_cliente', filtroCliente)

      const res = await fetch(`/api/reservas-clientes?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar reservas')
      const data = await res.json()
      setReservas(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar reservas de clientes')
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
      const res = await fetch('/api/estados-generales?entidad_aplicable=reserva_cliente')
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
    fetchReservas()
  }, [fetchReservas])

  useEffect(() => {
    setPagina(1)
  }, [search, filtroEstado, filtroCliente])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/reservas-clientes/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Reserva eliminada')
      fetchReservas()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar reserva')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedReserva(null)
    fetchReservas()
  }

  const openNew = () => {
    setSelectedReserva(null)
    setFormOpen(true)
  }

  const openEdit = (reserva: ReservaCliente) => {
    setSelectedReserva(reserva)
    setFormOpen(true)
  }

  const getClienteName = (reserva: ReservaCliente) => {
    if (reserva.cliente?.razon_social) return reserva.cliente.razon_social
    return `${reserva.cliente?.nombre || ''} ${reserva.cliente?.apellido || ''}`.trim()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  if (loading && reservas.length === 0) {
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
              placeholder="Buscar reservas..."
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
          Nueva Reserva
        </Button>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha Reserva</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead className="hidden md:table-cell">Válida Hasta</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Seña</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search || filtroEstado || filtroCliente
                      ? 'No se encontraron reservas con los filtros aplicados'
                      : 'No hay reservas de clientes registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                reservas.map((reserva) => (
                  <TableRow key={reserva.id} className="hover:bg-mostaza/5">
                    <TableCell className="text-sm text-marron whitespace-nowrap">
                      {format(new Date(reserva.fecha_reserva), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      {getClienteName(reserva)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {reserva.productoTerminado?.nombre || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reserva.cantidad_reservada}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {reserva.fecha_validez_hasta
                        ? format(new Date(reserva.fecha_validez_hasta), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
                      {reserva.senia > 0 ? formatCurrency(reserva.senia) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadgeClass(reserva.estado?.nombre_estado || '')}>
                        {reserva.estado?.nombre_estado || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-mostaza/10"
                          onClick={() => openEdit(reserva)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-rojo/10"
                          onClick={() => setDeleteId(reserva.id)}
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
          if (!open) setSelectedReserva(null)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedReserva ? 'Editar Reserva de Cliente' : 'Nueva Reserva de Cliente'}
            </DialogTitle>
          </DialogHeader>
          <ReservaClienteForm
            reserva={selectedReserva}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setSelectedReserva(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La reserva de cliente será eliminada permanentemente.
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
