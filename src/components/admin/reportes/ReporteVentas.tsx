'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, DollarSign } from 'lucide-react'

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

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n)

interface Opciones {
  productos: { value: string; label: string }[]
  clientes: { value: string; label: string }[]
  vendedores: { value: string; label: string }[]
}

export default function ReporteVentas() {
  const [opciones, setOpciones] = useState<Opciones>({ productos: [], clientes: [], vendedores: [] })

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [productoId, setProductoId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [vendedorId, setVendedorId] = useState('')

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  // Cargar opciones de filtros al montar
  useEffect(() => {
    fetch('/api/reportes/filtros-opciones')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOpciones({ productos: d.productos, clientes: d.clientes, vendedores: d.vendedores }))
      .catch(() => toast.error('Error al cargar opciones de filtros'))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)
      if (productoId && productoId !== 'todos') params.set('producto_id', productoId)
      if (clienteId && clienteId !== 'todos') params.set('cliente_id', clienteId)
      if (vendedorId && vendedorId !== 'todos') params.set('vendedor_id', vendedorId)
      const res = await fetch(`/api/reportes/ventas?${params.toString()}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Error al cargar reporte de ventas')
    } finally {
      setLoading(false)
    }
  }, [fechaDesde, fechaHasta, productoId, clienteId, vendedorId])

  // Carga inicial (sin filtros = todas las ventas)
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const extras: FiltroExtra[] = [
    { kind: 'select', key: 'producto', label: 'Producto', placeholder: 'Todos los productos', options: opciones.productos },
    { kind: 'select', key: 'cliente', label: 'Cliente', placeholder: 'Todos los clientes', options: opciones.clientes },
    { kind: 'select', key: 'vendedor', label: 'Vendedor', placeholder: 'Todos los vendedores', options: opciones.vendedores },
  ]

  const handleExtraChange = (key: string, value: string | boolean) => {
    if (key === 'producto') setProductoId(value as string)
    if (key === 'cliente') setClienteId(value as string)
    if (key === 'vendedor') setVendedorId(value as string)
  }

  const extraValues: Record<string, string | boolean> = {
    producto: productoId,
    cliente: clienteId,
    vendedor: vendedorId,
  }

  return (
    <div className="space-y-4">
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
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Ventas</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-marron">{formatPrice(data.resumen.totalVentas)}</p></CardContent>
            </Card>
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cantidad</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-marron">{data.resumen.cantidadVentas}</p></CardContent>
            </Card>
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ticket Promedio</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-marron">{formatPrice(data.resumen.ticketPromedio)}</p></CardContent>
            </Card>
          </div>

          {/* Productos más vendidos */}
          <Card className="border-marron/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron">Productos Más Vendidos</CardTitle>
              <div className="flex gap-2">
                <ExportadorExcel data={data.productosMasVendidos} filename="productos_mas_vendidos" columns={[{ key: 'nombre', header: 'Producto' }, { key: 'cantidad', header: 'Cantidad' }, { key: 'subtotal', header: 'Subtotal' }]} modulo="reportes" />
                <ExportadorCSV data={data.productosMasVendidos} filename="productos_mas_vendidos" columns={[{ key: 'nombre', header: 'Producto' }, { key: 'cantidad', header: 'Cantidad' }, { key: 'subtotal', header: 'Subtotal' }]} modulo="reportes" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Producto</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Subtotal</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.productosMasVendidos.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin datos para los filtros seleccionados</TableCell></TableRow>
                  ) : data.productosMasVendidos.map((p: any, i: number) => (
                    <TableRow key={i}><TableCell className="font-medium">{p.nombre}</TableCell><TableCell className="text-right">{formatNumber(p.cantidad)}</TableCell><TableCell className="text-right">{formatPrice(p.subtotal)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Clientes más frecuentes */}
          <Card className="border-marron/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron">Clientes Más Frecuentes</CardTitle>
              <ExportadorExcel data={data.clientesMasFrecuentes} filename="clientes_frecuentes" columns={[{ key: 'nombre', header: 'Cliente' }, { key: 'compras', header: 'Compras' }, { key: 'total', header: 'Total' }]} modulo="reportes" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Cliente</TableHead><TableHead className="text-right">Compras</TableHead><TableHead className="text-right">Total</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.clientesMasFrecuentes.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin datos para los filtros seleccionados</TableCell></TableRow>
                  ) : data.clientesMasFrecuentes.map((c: any, i: number) => (
                    <TableRow key={i}><TableCell className="font-medium">{c.nombre}</TableCell><TableCell className="text-right">{c.compras}</TableCell><TableCell className="text-right">{formatPrice(c.total)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Ventas por Vendedor (nuevo, relevante cuando se filtra por vendedor) */}
          {data.ventasPorVendedor && data.ventasPorVendedor.length > 0 && (
            <Card className="border-marron/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-marron">Ventas por Vendedor</CardTitle>
                <ExportadorExcel data={data.ventasPorVendedor} filename="ventas_por_vendedor" columns={[{ key: 'nombre', header: 'Vendedor' }, { key: 'ventas', header: 'Ventas' }, { key: 'total', header: 'Total' }]} modulo="reportes" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Vendedor</TableHead><TableHead className="text-right">N° Ventas</TableHead><TableHead className="text-right">Total</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.ventasPorVendedor.map((v: any, i: number) => (
                      <TableRow key={i}><TableCell className="font-medium">{v.nombre}</TableCell><TableCell className="text-right">{v.ventas}</TableCell><TableCell className="text-right">{formatPrice(v.total)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Ventas por día */}
          <Card className="border-marron/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron">Ventas por Día</CardTitle>
              <ExportadorExcel data={data.ventasPorDia} filename="ventas_por_dia" columns={[{ key: 'fecha', header: 'Fecha' }, { key: 'cantidad', header: 'Ventas' }, { key: 'total', header: 'Total' }]} modulo="reportes" />
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Fecha</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Total</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.ventasPorDia.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin datos para los filtros seleccionados</TableCell></TableRow>
                    ) : data.ventasPorDia.map((d: any, i: number) => (
                      <TableRow key={i}><TableCell>{d.fecha}</TableCell><TableCell className="text-right">{d.cantidad}</TableCell><TableCell className="text-right">{formatPrice(d.total)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detalle de ventas filtradas */}
          {data.ventas && data.ventas.length > 0 && (
            <Card className="border-marron/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-marron">Detalle de Ventas ({data.ventas.length})</CardTitle>
                <div className="flex gap-2">
                  <ExportadorExcel
                    data={data.ventas.map((v: any) => ({
                      id: v.id,
                      fecha: new Date(v.fecha_venta).toLocaleDateString('es-AR'),
                      cliente: v.cliente.razon_social || `${v.cliente.nombre} ${v.cliente.apellido}`,
                      vendedor: v.vendedor?.persona ? `${v.vendedor.persona.nombre} ${v.vendedor.persona.apellido}`.trim() : v.vendedor?.email || '',
                      total: v.total,
                      estado: v.estado?.nombre_estado || '',
                    }))}
                    filename="detalle_ventas"
                    columns={[
                      { key: 'id', header: 'N°' },
                      { key: 'fecha', header: 'Fecha' },
                      { key: 'cliente', header: 'Cliente' },
                      { key: 'vendedor', header: 'Vendedor' },
                      { key: 'total', header: 'Total' },
                      { key: 'estado', header: 'Estado' },
                    ]}
                    modulo="reportes"
                  />
                  <ExportadorCSV
                    data={data.ventas.map((v: any) => ({
                      id: v.id,
                      fecha: new Date(v.fecha_venta).toLocaleDateString('es-AR'),
                      cliente: v.cliente.razon_social || `${v.cliente.nombre} ${v.cliente.apellido}`,
                      vendedor: v.vendedor?.persona ? `${v.vendedor.persona.nombre} ${v.vendedor.persona.apellido}`.trim() : v.vendedor?.email || '',
                      total: v.total,
                      estado: v.estado?.nombre_estado || '',
                    }))}
                    filename="detalle_ventas"
                    columns={[
                      { key: 'id', header: 'N°' },
                      { key: 'fecha', header: 'Fecha' },
                      { key: 'cliente', header: 'Cliente' },
                      { key: 'vendedor', header: 'Vendedor' },
                      { key: 'total', header: 'Total' },
                      { key: 'estado', header: 'Estado' },
                    ]}
                    modulo="reportes"
                  />
                  <ExportadorPDF
                    data={data.ventas.map((v: any) => ({
                      id: String(v.id),
                      fecha: new Date(v.fecha_venta).toLocaleDateString('es-AR'),
                      cliente: v.cliente.razon_social || `${v.cliente.nombre} ${v.cliente.apellido}`,
                      vendedor: v.vendedor?.persona ? `${v.vendedor.persona.nombre} ${v.vendedor.persona.apellido}`.trim() : v.vendedor?.email || '',
                      total: formatPrice(v.total),
                      estado: v.estado?.nombre_estado || '',
                    }))}
                    filename="detalle_ventas"
                    title="Detalle de Ventas"
                    columns={[
                      { key: 'id', header: 'N°' },
                      { key: 'fecha', header: 'Fecha' },
                      { key: 'cliente', header: 'Cliente' },
                      { key: 'vendedor', header: 'Vendedor' },
                      { key: 'total', header: 'Total' },
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
                      <TableHead>N°</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Vendedor</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {data.ventas.slice(0, 100).map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">#{v.id}</TableCell>
                          <TableCell>{new Date(v.fecha_venta).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>{v.cliente.razon_social || `${v.cliente.nombre} ${v.cliente.apellido}`}</TableCell>
                          <TableCell>{v.vendedor?.persona ? `${v.vendedor.persona.nombre} ${v.vendedor.persona.apellido}`.trim() : v.vendedor?.email || '—'}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(v.total)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{v.estado?.nombre_estado || '—'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.ventas.length > 100 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Mostrando 100 de {data.ventas.length} ventas. Exporte para ver el detalle completo.
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
