'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, FileText, Mail, ChevronLeft, ChevronRight, History } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface DocGenerado {
  id: number
  tipo: string
  entidad_id: number
  entidad_tipo: string
  formato: string
  generado_por: number | null
  email_enviado: boolean
  destinatario: string | null
  metadata: string | null
  fecha: string
  usuario: { id: number; email: string; persona: { nombre: string; apellido: string } } | null
}

const TIPO_LABELS: Record<string, string> = {
  factura: 'Factura',
  ticket: 'Ticket',
  remito: 'Remito',
  orden_venta: 'Orden de Venta',
  orden_compra: 'Orden de Compra',
  orden_produccion: 'Orden de Producción',
  ficha_producto: 'Ficha de Producto',
  ficha_materia_prima: 'Ficha de Materia Prima',
  ficha_receta: 'Ficha de Receta',
  ficha_persona: 'Ficha de Persona',
  ficha_insumo: 'Ficha de Insumo',
  orden_pedido_proveedor: 'Orden de Pedido a Proveedor',
  reporte_stock: 'Reporte de Stock',
  reporte_movimientos: 'Reporte de Movimientos',
  resumen_dashboard: 'Resumen del Dashboard',
}

export default function DocumentosHistorial() {
  const [docs, setDocs] = useState<DocGenerado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('all')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pagina: String(pagina), limite: '15' })
      if (filtroTipo !== 'all') params.set('tipo', filtroTipo)
      const res = await fetch(`/api/documentos/historial?${params}`)
      if (!res.ok) throw new Error('Error al cargar historial')
      const data = await res.json()
      setDocs(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
    } catch {
      toast.error('Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }, [pagina, filtroTipo])

  useEffect(() => { fetchDocs() }, [fetchDocs])
  useEffect(() => { setPagina(1) }, [filtroTipo])

  const getTipoLabel = (t: string) => TIPO_LABELS[t] || t
  const getMetadata = (m: string | null): Record<string, unknown> => {
    if (!m) return {}
    try { return JSON.parse(m) } catch { return {} }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-marron/10 p-2">
          <History className="h-5 w-5 text-marron" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-marron">Historial de Documentos Generados</h2>
          <p className="text-sm text-muted-foreground">
            Registro de documentos enviados por email y generados
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="factura">Facturas</SelectItem>
            <SelectItem value="orden_compra">Órdenes de Compra</SelectItem>
            <SelectItem value="orden_produccion">Órdenes de Producción</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{total} documento(s)</span>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Generado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-mostaza mx-auto" />
                  </TableCell>
                </TableRow>
              ) : docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay documentos registrados
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((d) => {
                  const meta = getMetadata(d.metadata)
                  return (
                    <TableRow key={d.id} className="hover:bg-mostaza/5">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(d.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-mostaza" />
                          <span className="text-sm font-medium text-marron">{getTipoLabel(d.tipo)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{d.entidad_tipo}</span>
                        <span className="ml-1 font-medium">#{d.entidad_id}</span>
                        {meta.comprobante ? <span className="ml-1 text-xs text-muted-foreground">({String(meta.comprobante)})</span> : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs uppercase">{d.formato}</Badge>
                      </TableCell>
                      <TableCell>
                        {d.email_enviado ? (
                          <Badge className="bg-oliva/10 text-oliva text-xs gap-1">
                            <Mail className="h-3 w-3" /> Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.destinatario || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {d.usuario?.persona ? `${d.usuario.persona.nombre} ${d.usuario.persona.apellido}` : d.usuario?.email || 'Sistema'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagina} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
