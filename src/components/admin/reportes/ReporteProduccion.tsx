'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, Factory } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ExportadorExcel from '@/components/admin/reportes/ExportadorExcel'
import ExportadorPDF from '@/components/admin/reportes/ExportadorPDF'
import ExportadorCSV from '@/components/admin/reportes/ExportadorCSV'
import FiltrosReportes, { type FiltroExtra } from '@/components/admin/reportes/FiltrosReportes'
import ReporteExportMenu from '@/components/admin/reportes/ReporteExportMenu'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n)

interface Opciones {
  productos: { value: string; label: string }[]
}

export default function ReporteProduccion() {
  const [opciones, setOpciones] = useState<Opciones>({ productos: [] })

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [productoId, setProductoId] = useState('')

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/reportes/filtros-opciones')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOpciones({ productos: d.productos }))
      .catch(() => toast.error('Error al cargar opciones de filtros'))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)
      if (productoId && productoId !== 'todos') params.set('producto_id', productoId)
      const res = await fetch(`/api/reportes/produccion?${params.toString()}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Error al cargar reporte de producción')
    } finally {
      setLoading(false)
    }
  }, [fechaDesde, fechaHasta, productoId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const extras: FiltroExtra[] = [
    { kind: 'select', key: 'producto', label: 'Producto', placeholder: 'Todos los productos', options: opciones.productos },
  ]

  const handleExtraChange = (key: string, value: string | boolean) => {
    if (key === 'producto') setProductoId(value as string)
  }

  const extraValues: Record<string, string | boolean> = { producto: productoId }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <ReporteExportMenu
          tipo="produccion"
          data={data ? {
            resumen: data.resumen,
            costosPorProducto: data.costosPorProducto,
            producciones: data.producciones,
            filtros: {
              ...(fechaDesde ? { fechaDesde } : {}),
              ...(fechaHasta ? { fechaHasta } : {}),
              ...(productoId && productoId !== 'todos' ? { producto: productoId } : {}),
            },
          } : null}
          filename="reporte_produccion"
          disabled={!data}
        />
      </div>
      <FiltrosReportes
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onFechasChange={(d, h) => { setFechaDesde(d); setFechaHasta(h) }}
        extras={extras}
        extraValues={extraValues}
        onExtraChange={handleExtraChange}
        onApply={fetchData}
        onClear={() => setData(null)}
        loading={loading}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-mostaza" /></div>
      ) : data ? (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Producido</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-marron">{formatNumber(data.resumen.totalProducido)} u.</p></CardContent>
            </Card>
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Costo Total</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-marron">{formatPrice(data.resumen.costoTotal)}</p></CardContent>
            </Card>
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Costo Promedio</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-marron">{formatPrice(data.resumen.costoPromedio)}/u</p></CardContent>
            </Card>
          </div>

          {/* Costos por Producto */}
          <Card className="border-marron/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                <Factory className="h-4 w-4" /> Costos por Producto
              </CardTitle>
              <div className="flex gap-2">
                <ExportadorExcel
                  data={data.costosPorProducto.map((c: any) => ({ producto: c.producto, producido: c.producido, costoTotal: c.costoTotal, costoPromedio: c.costoPromedio }))}
                  filename="costos_produccion"
                  columns={[{ key: 'producto', header: 'Producto' }, { key: 'producido', header: 'Producido' }, { key: 'costoTotal', header: 'Costo Total' }, { key: 'costoPromedio', header: 'Costo Prom.' }]}
                  modulo="reportes"
                />
                <ExportadorCSV
                  data={data.costosPorProducto.map((c: any) => ({ producto: c.producto, producido: c.producido, costoTotal: c.costoTotal, costoPromedio: c.costoPromedio }))}
                  filename="costos_produccion"
                  columns={[{ key: 'producto', header: 'Producto' }, { key: 'producido', header: 'Producido' }, { key: 'costoTotal', header: 'Costo Total' }, { key: 'costoPromedio', header: 'Costo Prom.' }]}
                  modulo="reportes"
                />
                <ExportadorPDF
                  data={data.costosPorProducto.map((c: any) => ({ producto: c.producto, producido: String(c.producido), costoTotal: formatPrice(c.costoTotal), costoPromedio: formatPrice(c.costoPromedio) }))}
                  filename="costos_produccion"
                  title="Costos de Producción"
                  columns={[{ key: 'producto', header: 'Producto' }, { key: 'producido', header: 'Producido' }, { key: 'costoTotal', header: 'Costo Total' }, { key: 'costoPromedio', header: 'Costo Prom.' }]}
                  modulo="reportes"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Producto</TableHead><TableHead className="text-right">Producido</TableHead><TableHead className="text-right">Costo Total</TableHead><TableHead className="text-right">Costo Prom.</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.costosPorProducto.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin datos para los filtros seleccionados</TableCell></TableRow>
                  ) : data.costosPorProducto.map((c: any, i: number) => (
                    <TableRow key={i}><TableCell className="font-medium">{c.producto}</TableCell><TableCell className="text-right">{formatNumber(c.producido)} u.</TableCell><TableCell className="text-right">{formatPrice(c.costoTotal)}</TableCell><TableCell className="text-right">{formatPrice(c.costoPromedio)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detalle de producciones */}
          {data.producciones && data.producciones.length > 0 && (
            <Card className="border-marron/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-marron">Detalle de Producciones ({data.producciones.length})</CardTitle>
                <div className="flex gap-2">
                  <ExportadorExcel
                    data={data.producciones.map((p: any) => ({
                      id: p.id,
                      fecha: new Date(p.fecha_produccion).toLocaleDateString('es-AR'),
                      producto: p.receta?.productoTerminado?.nombre || '',
                      receta: p.receta?.nombre_receta || '',
                      cantidad: p.cantidad_producida,
                      costo_total: p.costo_total,
                      supervisor: p.supervisor ? `${p.supervisor.nombre} ${p.supervisor.apellido}`.trim() : '',
                      estado: p.estado?.nombre_estado || '',
                    }))}
                    filename="detalle_produccion"
                    columns={[
                      { key: 'id', header: 'N°' },
                      { key: 'fecha', header: 'Fecha' },
                      { key: 'producto', header: 'Producto' },
                      { key: 'receta', header: 'Receta' },
                      { key: 'cantidad', header: 'Cantidad' },
                      { key: 'costo_total', header: 'Costo Total' },
                      { key: 'supervisor', header: 'Supervisor' },
                      { key: 'estado', header: 'Estado' },
                    ]}
                    modulo="reportes"
                  />
                  <ExportadorCSV
                    data={data.producciones.map((p: any) => ({
                      id: p.id,
                      fecha: new Date(p.fecha_produccion).toLocaleDateString('es-AR'),
                      producto: p.receta?.productoTerminado?.nombre || '',
                      receta: p.receta?.nombre_receta || '',
                      cantidad: p.cantidad_producida,
                      costo_total: p.costo_total,
                      supervisor: p.supervisor ? `${p.supervisor.nombre} ${p.supervisor.apellido}`.trim() : '',
                      estado: p.estado?.nombre_estado || '',
                    }))}
                    filename="detalle_produccion"
                    columns={[
                      { key: 'id', header: 'N°' },
                      { key: 'fecha', header: 'Fecha' },
                      { key: 'producto', header: 'Producto' },
                      { key: 'receta', header: 'Receta' },
                      { key: 'cantidad', header: 'Cantidad' },
                      { key: 'costo_total', header: 'Costo Total' },
                      { key: 'supervisor', header: 'Supervisor' },
                      { key: 'estado', header: 'Estado' },
                    ]}
                    modulo="reportes"
                  />
                  <ExportadorPDF
                    data={data.producciones.map((p: any) => ({
                      id: String(p.id),
                      fecha: new Date(p.fecha_produccion).toLocaleDateString('es-AR'),
                      producto: p.receta?.productoTerminado?.nombre || '',
                      receta: p.receta?.nombre_receta || '',
                      cantidad: String(p.cantidad_producida),
                      costo_total: formatPrice(p.costo_total),
                      supervisor: p.supervisor ? `${p.supervisor.nombre} ${p.supervisor.apellido}`.trim() : '',
                      estado: p.estado?.nombre_estado || '',
                    }))}
                    filename="detalle_produccion"
                    title="Detalle de Producciones"
                    columns={[
                      { key: 'id', header: 'N°' },
                      { key: 'fecha', header: 'Fecha' },
                      { key: 'producto', header: 'Producto' },
                      { key: 'receta', header: 'Receta' },
                      { key: 'cantidad', header: 'Cantidad' },
                      { key: 'costo_total', header: 'Costo Total' },
                      { key: 'supervisor', header: 'Supervisor' },
                      { key: 'estado', header: 'Estado' },
                    ]}
                    modulo="reportes"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>N°</TableHead><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Costo</TableHead><TableHead>Supervisor</TableHead><TableHead>Estado</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {data.producciones.slice(0, 100).map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">#{p.id}</TableCell>
                          <TableCell>{new Date(p.fecha_produccion).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>{p.receta?.productoTerminado?.nombre || '—'}</TableCell>
                          <TableCell className="text-right">{formatNumber(p.cantidad_producida)} u.</TableCell>
                          <TableCell className="text-right">{formatPrice(p.costo_total)}</TableCell>
                          <TableCell>{p.supervisor ? `${p.supervisor.nombre} ${p.supervisor.apellido}`.trim() : '—'}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{p.estado?.nombre_estado || '—'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.producciones.length > 100 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Mostrando 100 de {data.producciones.length} producciones. Exporte para ver el detalle completo.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
