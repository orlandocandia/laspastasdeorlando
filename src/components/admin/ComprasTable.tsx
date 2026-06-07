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
import CompraForm from './CompraForm'

interface Compra {
  id: number
  id_proveedor: number
  id_forma_pago: number
  numero_factura: string | null
  fecha_compra: string
  subtotal: number
  iva: number
  total: number
  id_estado: number
  observaciones: string | null
  createdAt: string
  updatedAt: string | null
  proveedor: { id: number; nombre: string; apellido: string; razon_social: string | null }
  formaPago: { id: number; nombre_forma: string }
  estado: { id: number; nombre_estado: string; entidad_aplicable: string | null }
  detalle: DetalleCompra[]
}

interface DetalleCompra {
  id: number
  id_compra: number
  id_materia_prima: number | null
  id_insumo: number | null
  id_marca: number | null
  cantidad_comprada: number
  id_unidad_compra: number
  precio_unitario: number
  precio_total: number
  fecha_vencimiento: string | null
  lote: string | null
  materiaPrima?: { id: number; nombre: string; id_unidad_base: number; unidadBase: { id: number; codigo: string; nombre: string }; precio_compra_referencia: number } | null
  insumo?: { id: number; nombre: string; id_unidad_base: number; unidadBase: { id: number; codigo: string; nombre: string }; precio_compra_referencia: number } | null
  marca?: { id: number; nombre: string } | null
  unidadCompra: { id: number; codigo: string; nombre: string }
}

interface Proveedor {
  id: number
  nombre: string
  apellido: string
  razon_social: string | null
}

const ESTADO_BADGE_MAP: Record<string, string> = {
  pendiente: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
  en_proceso: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  completado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  recibido: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  anulado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
}

function getEstadoBadgeClass(nombreEstado: string): string {
  const key = nombreEstado.toLowerCase().replace(/ /g, '_')
  return ESTADO_BADGE_MAP[key] || 'bg-muted text-muted-foreground'
}

export default function ComprasTable() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroProveedor, setFiltroProveedor] = useState<string>('')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [estados, setEstados] = useState<{ id: number; nombre_estado: string }[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteEstado, setDeleteEstado] = useState<string>('')

  const fetchCompras = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '10')
      if (search) params.set('buscar', search)
      if (filtroEstado && filtroEstado !== 'all') params.set('id_estado', filtroEstado)
      if (filtroProveedor && filtroProveedor !== 'all') params.set('id_proveedor', filtroProveedor)

      const res = await fetch(`/api/compras?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar compras')
      const data = await res.json()
      setCompras(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar compras')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroEstado, filtroProveedor])

  const fetchProveedores = useCallback(async () => {
    try {
      const res = await fetch('/api/personas?tipo=proveedor&limite=100')
      if (!res.ok) throw new Error('Error al cargar proveedores')
      const data = await res.json()
      setProveedores(data.personas || [])
    } catch {
      // silent
    }
  }, [])

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch('/api/estados-generales?entidad_aplicable=compra')
      if (!res.ok) throw new Error('Error al cargar estados')
      const data = await res.json()
      setEstados(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchProveedores()
    fetchEstados()
  }, [fetchProveedores, fetchEstados])

  useEffect(() => {
    fetchCompras()
  }, [fetchCompras])

  useEffect(() => {
    setPagina(1)
  }, [search, filtroEstado, filtroProveedor])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/compras/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Compra eliminada')
      fetchCompras()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar compra')
    } finally {
      setDeleteId(null)
      setDeleteEstado('')
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedCompra(null)
    fetchCompras()
  }

  const openNew = () => {
    setSelectedCompra(null)
    setFormOpen(true)
  }

  const openEdit = (compra: Compra) => {
    setSelectedCompra(compra)
    setFormOpen(true)
  }

  const getProveedorName = (compra: Compra) => {
    if (compra.proveedor?.razon_social) return compra.proveedor.razon_social
    return `${compra.proveedor?.nombre || ''} ${compra.proveedor?.apellido || ''}`.trim()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  if (loading && compras.length === 0) {
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
              placeholder="Buscar por nº factura..."
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
          <Select value={filtroProveedor} onValueChange={setFiltroProveedor}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {proveedores.map((prov) => (
                <SelectItem key={prov.id} value={prov.id.toString()}>
                  {prov.razon_social || `${prov.nombre} ${prov.apellido}`}
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
          Nueva Compra
        </Button>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="hidden md:table-cell">Factura</TableHead>
                <TableHead className="hidden lg:table-cell">Forma Pago</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Subtotal</TableHead>
                <TableHead className="hidden lg:table-cell text-right">IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search || filtroEstado || filtroProveedor
                      ? 'No se encontraron compras con los filtros aplicados'
                      : 'No hay compras registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => (
                  <TableRow key={compra.id} className="hover:bg-mostaza/5">
                    <TableCell className="text-sm text-marron whitespace-nowrap">
                      {format(new Date(compra.fecha_compra), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      {getProveedorName(compra)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {compra.numero_factura || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {compra.formaPago?.nombre_forma || '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-sm">
                      {formatCurrency(compra.subtotal)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                      {formatCurrency(compra.iva)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-marron">
                      {formatCurrency(compra.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadgeClass(compra.estado?.nombre_estado || '')}>
                        {compra.estado?.nombre_estado || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-mostaza/10"
                          onClick={() => openEdit(compra)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-rojo/10"
                          disabled={compra.estado?.nombre_estado?.toLowerCase() !== 'pendiente'}
                          onClick={() => {
                            setDeleteId(compra.id)
                            setDeleteEstado(compra.estado?.nombre_estado || '')
                          }}
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
          if (!open) setSelectedCompra(null)
        }}
      >
        <DialogContent className="sm:max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedCompra ? 'Editar Compra' : 'Nueva Compra'}
            </DialogTitle>
          </DialogHeader>
          <CompraForm
            compra={selectedCompra}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setSelectedCompra(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && (setDeleteId(null), setDeleteEstado(''))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La compra será eliminada permanentemente.
              {deleteEstado && deleteEstado.toLowerCase() !== 'pendiente' && (
                <span className="block mt-2 text-rojo font-medium">
                  Solo se pueden eliminar compras en estado &quot;Pendiente&quot;.
                </span>
              )}
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
