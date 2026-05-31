'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StockMovement {
  id: number
  tipo_movimiento: string
  id_materia_prima: number | null
  id_insumo: number | null
  id_producto_terminado: number | null
  cantidad: number
  id_unidad: number
  stock_antes: number
  stock_despues: number
  referencia_id: number | null
  referencia_tabla: string | null
  observacion: string | null
  id_usuario: number | null
  fecha_movimiento: string
  materiaPrima?: { id: number; nombre: string } | null
  insumo?: { id: number; nombre: string } | null
  productoTerminado?: { id: number; nombre: string } | null
  unidad: { id: number; codigo: string; nombre: string }
  usuario?: { id: number; persona: { nombre: string; apellido: string } } | null
}

const TIPO_MOVIMIENTO_LABELS: Record<string, string> = {
  compra: 'Compra',
  venta: 'Venta',
  produccion_consumo: 'Producción (Consumo)',
  produccion_genera: 'Producción (Genera)',
  ajuste_in: 'Ajuste (+)',
  ajuste_out: 'Ajuste (-)',
  devolucion: 'Devolución',
}

const TIPO_MOVIMIENTO_BADGE: Record<string, string> = {
  compra: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  venta: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
  produccion_consumo: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  produccion_genera: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  ajuste_in: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
  ajuste_out: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
  devolucion: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
}

function getTipoLabel(tipo: string): string {
  return TIPO_MOVIMIENTO_LABELS[tipo] || tipo
}

function getTipoBadgeClass(tipo: string): string {
  return TIPO_MOVIMIENTO_BADGE[tipo] || 'bg-muted text-muted-foreground'
}

export default function StockMovementsTable() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pagina', pagina.toString())
      params.set('limite', '20')
      if (search) params.set('buscar', search)
      if (filtroTipo && filtroTipo !== 'all') params.set('tipo_movimiento', filtroTipo)
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)

      const res = await fetch(`/api/stock-movements?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar movimientos')
      const data = await res.json()
      setMovements(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar movimientos de stock')
    } finally {
      setLoading(false)
    }
  }, [pagina, search, filtroTipo, fechaDesde, fechaHasta])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  useEffect(() => {
    setPagina(1)
  }, [search, filtroTipo, fechaDesde, fechaHasta])

  const getProductName = (m: StockMovement) => {
    if (m.materiaPrima) return m.materiaPrima.nombre
    if (m.insumo) return m.insumo.nombre
    if (m.productoTerminado) return m.productoTerminado.nombre
    return '-'
  }

  const getReferencia = (m: StockMovement) => {
    if (!m.referencia_tabla || !m.referencia_id) return '-'
    return `${m.referencia_tabla} #${m.referencia_id}`
  }

  if (loading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto u observación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tipo movimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(TIPO_MOVIMIENTO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full sm:w-auto"
            placeholder="Desde"
          />
          <span className="text-muted-foreground text-sm">a</span>
          <Input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full sm:w-auto"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo Mov.</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="hidden md:table-cell">Unidad</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Stock Antes</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Stock Después</TableHead>
                <TableHead className="hidden xl:table-cell">Referencia</TableHead>
                <TableHead className="hidden xl:table-cell">Observación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search || filtroTipo || fechaDesde || fechaHasta
                      ? 'No se encontraron movimientos con los filtros aplicados'
                      : 'No hay movimientos de stock registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id} className="hover:bg-mostaza/5">
                    <TableCell className="text-sm text-marron whitespace-nowrap">
                      {format(new Date(m.fecha_movimiento), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoBadgeClass(m.tipo_movimiento)}>
                        {getTipoLabel(m.tipo_movimiento)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      {getProductName(m)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <span
                        className={
                          m.cantidad >= 0 ? 'text-oliva font-semibold' : 'text-rojo font-semibold'
                        }
                      >
                        {m.cantidad >= 0 ? '+' : ''}
                        {m.cantidad}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {m.unidad?.codigo || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                      {m.stock_antes}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right font-medium">
                      {m.stock_despues}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-xs font-mono">
                      {getReferencia(m)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-xs max-w-[200px] truncate">
                      {m.observacion || '-'}
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
    </div>
  )
}
