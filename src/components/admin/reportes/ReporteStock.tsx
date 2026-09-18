'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, Package } from 'lucide-react'

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
import ExportadorCSV from '@/components/admin/reportes/ExportadorCSV'
import ExportadorPDF from '@/components/admin/reportes/ExportadorPDF'
import FiltrosReportes, { type FiltroExtra } from '@/components/admin/reportes/FiltrosReportes'
import ReporteExportMenu from '@/components/admin/reportes/ReporteExportMenu'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n)

interface Opciones {
  categoriasPT: { value: string; label: string }[]
  categoriasMP: { value: string; label: string }[]
  proveedores: { value: string; label: string }[]
}

export default function ReporteStock() {
  const [opciones, setOpciones] = useState<Opciones>({ categoriasPT: [], categoriasMP: [], proveedores: [] })

  const [categoriaPT, setCategoriaPT] = useState('')
  const [categoriaMP, setCategoriaMP] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [soloStockBajo, setSoloStockBajo] = useState(false)

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/reportes/filtros-opciones')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOpciones({ categoriasPT: d.categoriasPT, categoriasMP: d.categoriasMP, proveedores: d.proveedores }))
      .catch(() => toast.error('Error al cargar opciones de filtros'))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoriaPT && categoriaPT !== 'todos') params.set('categoria_pt', categoriaPT)
      if (categoriaMP && categoriaMP !== 'todos') params.set('categoria_mp', categoriaMP)
      if (proveedorId && proveedorId !== 'todos') params.set('proveedor_id', proveedorId)
      if (soloStockBajo) params.set('solo_stock_bajo', 'true')
      const res = await fetch(`/api/reportes/stock?${params.toString()}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Error al cargar reporte de stock')
    } finally {
      setLoading(false)
    }
  }, [categoriaPT, categoriaMP, proveedorId, soloStockBajo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const extras: FiltroExtra[] = [
    { kind: 'select', key: 'categoria_pt', label: 'Categoría (Productos)', placeholder: 'Todas', options: opciones.categoriasPT },
    { kind: 'select', key: 'categoria_mp', label: 'Categoría (Mat. Primas)', placeholder: 'Todas', options: opciones.categoriasMP },
    { kind: 'select', key: 'proveedor', label: 'Proveedor', placeholder: 'Todos', options: opciones.proveedores },
    { kind: 'checkbox', key: 'stock_bajo', label: 'Solo stock bajo (≤ mínimo)' },
  ]

  const handleExtraChange = (key: string, value: string | boolean) => {
    if (key === 'categoria_pt') setCategoriaPT(value as string)
    if (key === 'categoria_mp') setCategoriaMP(value as string)
    if (key === 'proveedor') setProveedorId(value as string)
    if (key === 'stock_bajo') setSoloStockBajo(value as boolean)
  }

  const extraValues: Record<string, string | boolean> = {
    categoria_pt: categoriaPT,
    categoria_mp: categoriaMP,
    proveedor: proveedorId,
    stock_bajo: soloStockBajo,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <ReporteExportMenu
          tipo="stock"
          data={data ? {
            resumen: data.resumen,
            alertasStock: data.alertasStock,
            productosTerminados: data.productosTerminados,
            materiasPrimas: data.materiasPrimas,
            insumos: data.insumos,
            filtros: {
              ...(categoriaPT && categoriaPT !== 'todos' ? { categoriaPT } : {}),
              ...(categoriaMP && categoriaMP !== 'todos' ? { categoriaMP } : {}),
              ...(proveedorId && proveedorId !== 'todos' ? { proveedor: proveedorId } : {}),
              ...(soloStockBajo ? { soloStockBajo: true } : {}),
            },
          } : null}
          filename="reporte_stock"
          disabled={!data}
        />
      </div>
      <FiltrosReportes
        fechaDesde=""
        fechaHasta=""
        onFechasChange={() => {}}
        extras={extras}
        extraValues={extraValues}
        onExtraChange={handleExtraChange}
        onApply={fetchData}
        onClear={() => setData(null)}
        loading={loading}
        showDateRange={false}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-mostaza" /></div>
      ) : data ? (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Valor Stock Total</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-marron">{formatPrice(data.resumen.valorStockTotal)}</p></CardContent>
            </Card>
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Stock Crítico</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-rojo">{data.resumen.stockCriticoMP + data.resumen.stockCriticoInsumos + data.resumen.stockCriticoPT}</p></CardContent>
            </Card>
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Valor MP + Insumos</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-marron">{formatPrice(data.resumen.valorStockMP + data.resumen.valorStockInsumos)}</p></CardContent>
            </Card>
            <Card className="border-marron/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Valor PT</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-marron">{formatPrice(data.resumen.valorStockPT)}</p></CardContent>
            </Card>
          </div>

          {/* Alertas de Stock */}
          {data.alertasStock.length > 0 && (
            <Card className="border-rojo/20 bg-rojo/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-rojo flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Alertas de Stock Bajo ({data.alertasStock.length})
                </CardTitle>
                <div className="flex gap-2">
                  <ExportadorExcel data={data.alertasStock} filename="alertas_stock" columns={[{ key: 'tipo', header: 'Tipo' }, { key: 'nombre', header: 'Nombre' }, { key: 'stock_actual', header: 'Stock Actual' }, { key: 'stock_minimo', header: 'Stock Mínimo' }]} modulo="reportes" />
                  <ExportadorCSV data={data.alertasStock} filename="alertas_stock" columns={[{ key: 'tipo', header: 'Tipo' }, { key: 'nombre', header: 'Nombre' }, { key: 'stock_actual', header: 'Stock Actual' }, { key: 'stock_minimo', header: 'Stock Mínimo' }]} modulo="reportes" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Tipo</TableHead><TableHead>Nombre</TableHead><TableHead className="text-right">Stock Actual</TableHead><TableHead className="text-right">Stock Mínimo</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {data.alertasStock.map((a: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell><Badge variant="outline" className="text-xs">{a.tipo}</Badge></TableCell>
                          <TableCell className="font-medium">{a.nombre}</TableCell>
                          <TableCell className="text-right text-rojo font-bold">{formatNumber(a.stock_actual)} {a.unidad}</TableCell>
                          <TableCell className="text-right">{formatNumber(a.stock_minimo)} {a.unidad}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Productos Terminados */}
          <Card className="border-marron/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                <Package className="h-4 w-4" /> Stock de Productos Terminados ({data.productosTerminados.length})
              </CardTitle>
              <div className="flex gap-2">
                <ExportadorExcel
                  data={data.productosTerminados.map((p: any) => ({ nombre: p.nombre, categoria: p.categoria?.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo, precio_venta: p.precio_venta, valor: p.stock_actual * p.precio_venta }))}
                  filename="stock_pt"
                  columns={[{ key: 'nombre', header: 'Producto' }, { key: 'categoria', header: 'Categoría' }, { key: 'stock_actual', header: 'Stock' }, { key: 'stock_minimo', header: 'Stock Mín.' }, { key: 'precio_venta', header: 'Precio' }, { key: 'valor', header: 'Valor' }]}
                  modulo="reportes"
                />
                <ExportadorCSV
                  data={data.productosTerminados.map((p: any) => ({ nombre: p.nombre, categoria: p.categoria?.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo, precio_venta: p.precio_venta, valor: p.stock_actual * p.precio_venta }))}
                  filename="stock_pt"
                  columns={[{ key: 'nombre', header: 'Producto' }, { key: 'categoria', header: 'Categoría' }, { key: 'stock_actual', header: 'Stock' }, { key: 'stock_minimo', header: 'Stock Mín.' }, { key: 'precio_venta', header: 'Precio' }, { key: 'valor', header: 'Valor' }]}
                  modulo="reportes"
                />
                <ExportadorPDF
                  data={data.productosTerminados.map((p: any) => ({ nombre: p.nombre, categoria: p.categoria?.nombre || '', stock_actual: formatNumber(p.stock_actual), stock_minimo: formatNumber(p.stock_minimo), precio_venta: formatPrice(p.precio_venta), valor: formatPrice(p.stock_actual * p.precio_venta) }))}
                  filename="stock_pt"
                  title="Stock de Productos Terminados"
                  columns={[{ key: 'nombre', header: 'Producto' }, { key: 'categoria', header: 'Categoría' }, { key: 'stock_actual', header: 'Stock' }, { key: 'stock_minimo', header: 'Stock Mín.' }, { key: 'precio_venta', header: 'Precio' }, { key: 'valor', header: 'Valor' }]}
                  modulo="reportes"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Producto</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Stock Mín.</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Valor</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.productosTerminados.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Sin datos para los filtros seleccionados</TableCell></TableRow>
                    ) : data.productosTerminados.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nombre}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.categoria?.nombre}</Badge></TableCell>
                        <TableCell className="text-right"><span className={p.stock_actual <= p.stock_minimo ? 'text-rojo font-bold' : ''}>{formatNumber(p.stock_actual)}</span></TableCell>
                        <TableCell className="text-right">{formatNumber(p.stock_minimo)}</TableCell>
                        <TableCell className="text-right">{formatPrice(p.precio_venta)}</TableCell>
                        <TableCell className="text-right">{formatPrice(p.stock_actual * p.precio_venta)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Materias Primas */}
          <Card className="border-marron/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron">Stock de Materias Primas ({data.materiasPrimas.length})</CardTitle>
              <div className="flex gap-2">
                <ExportadorExcel
                  data={data.materiasPrimas.map((m: any) => ({ nombre: m.nombre, categoria: m.categoria?.nombre, stock_actual: m.stock_actual, stock_minimo: m.stock_minimo, unidad: m.unidadBase?.codigo || '', precio_ref: m.precio_compra_referencia, valor: m.stock_actual * m.precio_compra_referencia }))}
                  filename="stock_mp"
                  columns={[{ key: 'nombre', header: 'Materia Prima' }, { key: 'categoria', header: 'Categoría' }, { key: 'stock_actual', header: 'Stock' }, { key: 'stock_minimo', header: 'Stock Mín.' }, { key: 'unidad', header: 'Unidad' }, { key: 'precio_ref', header: 'Precio Ref.' }, { key: 'valor', header: 'Valor' }]}
                  modulo="reportes"
                />
                <ExportadorCSV
                  data={data.materiasPrimas.map((m: any) => ({ nombre: m.nombre, categoria: m.categoria?.nombre, stock_actual: m.stock_actual, stock_minimo: m.stock_minimo, unidad: m.unidadBase?.codigo || '', precio_ref: m.precio_compra_referencia, valor: m.stock_actual * m.precio_compra_referencia }))}
                  filename="stock_mp"
                  columns={[{ key: 'nombre', header: 'Materia Prima' }, { key: 'categoria', header: 'Categoría' }, { key: 'stock_actual', header: 'Stock' }, { key: 'stock_minimo', header: 'Stock Mín.' }, { key: 'unidad', header: 'Unidad' }, { key: 'precio_ref', header: 'Precio Ref.' }, { key: 'valor', header: 'Valor' }]}
                  modulo="reportes"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Materia Prima</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Stock Mín.</TableHead><TableHead className="text-right">Valor</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.materiasPrimas.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin datos para los filtros seleccionados</TableCell></TableRow>
                    ) : data.materiasPrimas.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.nombre}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{m.categoria?.nombre}</Badge></TableCell>
                        <TableCell className="text-right"><span className={m.stock_actual <= m.stock_minimo ? 'text-rojo font-bold' : ''}>{formatNumber(m.stock_actual)} {m.unidadBase?.codigo}</span></TableCell>
                        <TableCell className="text-right">{formatNumber(m.stock_minimo)} {m.unidadBase?.codigo}</TableCell>
                        <TableCell className="text-right">{formatPrice(m.stock_actual * m.precio_compra_referencia)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Insumos */}
          <Card className="border-marron/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-marron">Stock de Insumos ({data.insumos.length})</CardTitle>
              <div className="flex gap-2">
                <ExportadorExcel
                  data={data.insumos.map((ins: any) => ({ nombre: ins.nombre, tipo: ins.tipoInsumo?.nombre, stock_actual: ins.stock_actual, stock_minimo: ins.stock_minimo, unidad: ins.unidadBase?.codigo || '', precio_ref: ins.precio_compra_referencia, valor: ins.stock_actual * ins.precio_compra_referencia }))}
                  filename="stock_insumos"
                  columns={[{ key: 'nombre', header: 'Insumo' }, { key: 'tipo', header: 'Tipo' }, { key: 'stock_actual', header: 'Stock' }, { key: 'stock_minimo', header: 'Stock Mín.' }, { key: 'unidad', header: 'Unidad' }, { key: 'precio_ref', header: 'Precio Ref.' }, { key: 'valor', header: 'Valor' }]}
                  modulo="reportes"
                />
                <ExportadorCSV
                  data={data.insumos.map((ins: any) => ({ nombre: ins.nombre, tipo: ins.tipoInsumo?.nombre, stock_actual: ins.stock_actual, stock_minimo: ins.stock_minimo, unidad: ins.unidadBase?.codigo || '', precio_ref: ins.precio_compra_referencia, valor: ins.stock_actual * ins.precio_compra_referencia }))}
                  filename="stock_insumos"
                  columns={[{ key: 'nombre', header: 'Insumo' }, { key: 'tipo', header: 'Tipo' }, { key: 'stock_actual', header: 'Stock' }, { key: 'stock_minimo', header: 'Stock Mín.' }, { key: 'unidad', header: 'Unidad' }, { key: 'precio_ref', header: 'Precio Ref.' }, { key: 'valor', header: 'Valor' }]}
                  modulo="reportes"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Insumo</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Stock Mín.</TableHead><TableHead className="text-right">Valor</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.insumos.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin datos para los filtros seleccionados</TableCell></TableRow>
                    ) : data.insumos.map((ins: any) => (
                      <TableRow key={ins.id}>
                        <TableCell className="font-medium">{ins.nombre}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{ins.tipoInsumo?.nombre}</Badge></TableCell>
                        <TableCell className="text-right"><span className={ins.stock_actual <= ins.stock_minimo ? 'text-rojo font-bold' : ''}>{formatNumber(ins.stock_actual)} {ins.unidadBase?.codigo}</span></TableCell>
                        <TableCell className="text-right">{formatNumber(ins.stock_minimo)} {ins.unidadBase?.codigo}</TableCell>
                        <TableCell className="text-right">{formatPrice(ins.stock_actual * ins.precio_compra_referencia)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
