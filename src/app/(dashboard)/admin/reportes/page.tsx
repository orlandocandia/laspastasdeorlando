'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import FiltrosReportes from '@/components/admin/reportes/FiltrosReportes'
import ReporteVentas from '@/components/admin/reportes/ReporteVentas'
import ReporteStock from '@/components/admin/reportes/ReporteStock'
import ReporteProduccion from '@/components/admin/reportes/ReporteProduccion'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n)

export default function ReportesPage() {
  const [tab, setTab] = useState('ventas')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [loading, setLoading] = useState(false)

  // Data states (compras, finanzas, rentabilidad se gestionan en la página;
  // ventas, stock y producción tienen componentes propios con filtros avanzados)
  const [comprasData, setComprasData] = useState<any>(null)
  const [finanzasData, setFinanzasData] = useState<any>(null)
  const [rentabilidadData, setRentabilidadData] = useState<any[]>([])
  const [rentSortKey, setRentSortKey] = useState<string>('margen_porcentaje')
  const [rentSortDir, setRentSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchCompras = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)
      const res = await fetch(`/api/reportes/compras?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setComprasData(data)
    } catch { toast.error('Error al cargar reporte de compras') }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta])

  const fetchFinanzas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)
      const res = await fetch(`/api/reportes/finanzas?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFinanzasData(data)
    } catch { toast.error('Error al cargar reporte financiero') }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta])

  const fetchRentabilidad = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/productos-terminados/costos')
      if (res.ok) {
        const data = await res.json()
        setRentabilidadData(data.data || [])
      }
    } catch (error) {
      console.error('Error al obtener datos de rentabilidad:', error)
      toast.error('Error al cargar reporte de rentabilidad')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    switch (tab) {
      case 'compras': fetchCompras(); break
      case 'finanzas': fetchFinanzas(); break
      case 'rentabilidad': fetchRentabilidad(); break
    }
  }, [tab, fetchCompras, fetchFinanzas, fetchRentabilidad])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marron">Reportes</h1>
        <p className="text-muted-foreground text-sm">Reportes exportables con filtros personalizados</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          <TabsTrigger value="rentabilidad" className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />Rentabilidad</TabsTrigger>
        </TabsList>

        {/* VENTAS — componente con filtros: período, producto, cliente, vendedor */}
        <TabsContent value="ventas" className="space-y-4">
          <ReporteVentas />
        </TabsContent>

        {/* COMPRAS — filtro de período */}
        <TabsContent value="compras" className="space-y-4">
          <FiltrosReportes
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onFechasChange={(d, h) => { setFechaDesde(d); setFechaHasta(h) }}
            onApply={fetchCompras}
            onClear={() => setComprasData(null)}
            loading={loading}
          />
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-mostaza" /></div>
          ) : comprasData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-marron/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Compras</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-marron">{formatPrice(comprasData.resumen.totalCompras)}</p></CardContent>
                </Card>
                <Card className="border-marron/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cantidad</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-marron">{comprasData.resumen.cantidadCompras}</p></CardContent>
                </Card>
                <Card className="border-marron/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Promedio</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-marron">{formatPrice(comprasData.resumen.promedioCompra)}</p></CardContent>
                </Card>
              </div>

              <Card className="border-marron/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base text-marron">Proveedores Más Utilizados</CardTitle>
                  <div className="flex gap-2">
                    <ExportadorExcel data={comprasData.proveedoresMasUtilizados} filename="proveedores" columns={[{ key: 'nombre', header: 'Proveedor' }, { key: 'compras', header: 'Compras' }, { key: 'total', header: 'Total' }]} modulo="reportes" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Proveedor</TableHead><TableHead className="text-right">Compras</TableHead><TableHead className="text-right">Total</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {comprasData.proveedoresMasUtilizados.map((p: any, i: number) => (
                        <TableRow key={i}><TableCell className="font-medium">{p.nombre}</TableCell><TableCell className="text-right">{p.compras}</TableCell><TableCell className="text-right">{formatPrice(p.total)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-marron/5">
                <CardHeader><CardTitle className="text-base text-marron">Productos Más Comprados</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Producto</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Total</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {comprasData.productosMasComprados.map((p: any, i: number) => (
                        <TableRow key={i}><TableCell className="font-medium">{p.nombre}</TableCell><TableCell className="text-right">{formatNumber(p.cantidad)}</TableCell><TableCell className="text-right">{formatPrice(p.total)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* STOCK — componente con filtros: categoría, proveedor, stock bajo */}
        <TabsContent value="stock" className="space-y-4">
          <ReporteStock />
        </TabsContent>

        {/* PRODUCCIÓN — componente con filtros: período, producto */}
        <TabsContent value="produccion" className="space-y-4">
          <ReporteProduccion />
        </TabsContent>

        {/* FINANZAS — filtro de período */}
        <TabsContent value="finanzas" className="space-y-4">
          <FiltrosReportes
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onFechasChange={(d, h) => { setFechaDesde(d); setFechaHasta(h) }}
            onApply={fetchFinanzas}
            onClear={() => setFinanzasData(null)}
            loading={loading}
          />
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-mostaza" /></div>
          ) : finanzasData ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-oliva/20">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-oliva" /> Ingresos</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-oliva">{formatPrice(finanzasData.resumen.ingresos)}</p></CardContent>
                </Card>
                <Card className="border-rojo/20">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-rojo" /> Egresos</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-rojo">{formatPrice(finanzasData.resumen.totalEgresos)}</p></CardContent>
                </Card>
                <Card className={finanzasData.resumen.resultado >= 0 ? 'border-oliva/20' : 'border-rojo/20'}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Resultado</CardTitle></CardHeader>
                  <CardContent><p className={`text-2xl font-bold ${finanzasData.resumen.resultado >= 0 ? 'text-oliva' : 'text-rojo'}`}>{formatPrice(finanzasData.resumen.resultado)}</p></CardContent>
                </Card>
                <Card className="border-marron/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margen</CardTitle></CardHeader>
                  <CardContent><p className={`text-2xl font-bold ${finanzasData.resumen.margenPromedio >= 0 ? 'text-oliva' : 'text-rojo'}`}>{finanzasData.resumen.margenPromedio.toFixed(1)}%</p></CardContent>
                </Card>
              </div>

              {/* Ingresos vs Egresos por mes */}
              <Card className="border-marron/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base text-marron">Ingresos vs Egresos por Mes</CardTitle>
                  <div className="flex gap-2">
                    <ExportadorExcel data={finanzasData.datosPorMes.map((m: any) => ({ mes: m.mes, ingresos: m.ingresos, egresosCompras: m.egresosCompras, egresosProduccion: m.egresosProduccion, resultado: m.ingresos - m.egresosCompras - m.egresosProduccion }))} filename="finanzas_mensual" columns={[{ key: 'mes', header: 'Mes' }, { key: 'ingresos', header: 'Ingresos' }, { key: 'egresosCompras', header: 'Egresos Compras' }, { key: 'egresosProduccion', header: 'Egresos Producción' }, { key: 'resultado', header: 'Resultado' }]} modulo="reportes" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Mes</TableHead><TableHead className="text-right">Ingresos</TableHead><TableHead className="text-right">Egresos Compras</TableHead><TableHead className="text-right">Egresos Prod.</TableHead><TableHead className="text-right">Resultado</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {finanzasData.datosPorMes.map((m: any, i: number) => {
                        const resultado = m.ingresos - m.egresosCompras - m.egresosProduccion
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{m.mes}</TableCell>
                            <TableCell className="text-right text-oliva">{formatPrice(m.ingresos)}</TableCell>
                            <TableCell className="text-right text-rojo">{formatPrice(m.egresosCompras)}</TableCell>
                            <TableCell className="text-right text-rojo">{formatPrice(m.egresosProduccion)}</TableCell>
                            <TableCell className={`text-right font-bold ${resultado >= 0 ? 'text-oliva' : 'text-rojo'}`}>{formatPrice(resultado)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Margen por producto */}
              <Card className="border-marron/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base text-marron">Margen por Producto</CardTitle>
                  <div className="flex gap-2">
                    <ExportadorExcel data={finanzasData.margenesPorProducto.map((m: any) => ({ producto: m.producto, ingreso: m.ingreso, costoProduccion: m.costoProduccion, margen: m.margen.toFixed(2) + '%' }))} filename="margen_producto" columns={[{ key: 'producto', header: 'Producto' }, { key: 'ingreso', header: 'Ingreso' }, { key: 'costoProduccion', header: 'Costo Prod.' }, { key: 'margen', header: 'Margen %' }]} modulo="reportes" />
                    <ExportadorPDF data={finanzasData.margenesPorProducto.map((m: any) => ({ producto: m.producto, ingreso: formatPrice(m.ingreso), costoProduccion: formatPrice(m.costoProduccion), margen: m.margen.toFixed(1) + '%' }))} filename="margen_producto" title="Margen por Producto" columns={[{ key: 'producto', header: 'Producto' }, { key: 'ingreso', header: 'Ingreso' }, { key: 'costoProduccion', header: 'Costo Prod.' }, { key: 'margen', header: 'Margen' }]} modulo="reportes" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Producto</TableHead><TableHead className="text-right">Ingreso</TableHead><TableHead className="text-right">Costo Prod.</TableHead><TableHead className="text-right">Margen</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {finanzasData.margenesPorProducto.map((m: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{m.producto}</TableCell>
                          <TableCell className="text-right">{formatPrice(m.ingreso)}</TableCell>
                          <TableCell className="text-right">{formatPrice(m.costoProduccion)}</TableCell>
                          <TableCell className={`text-right font-bold ${m.margen >= 0 ? 'text-oliva' : 'text-rojo'}`}>{m.margen.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* RENTABILIDAD */}
        <TabsContent value="rentabilidad" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-mostaza" /></div>
          ) : rentabilidadData.length > 0 ? (
            (() => {
              const conReceta = rentabilidadData.filter((p: any) => p.tiene_receta)
              const sinReceta = rentabilidadData.filter((p: any) => !p.tiene_receta)
              const margenPromedio = conReceta.length > 0
                ? conReceta.reduce((s: number, p: any) => s + p.margen_porcentaje, 0) / conReceta.length
                : 0
              const masRentable = conReceta.length > 0
                ? conReceta.reduce((best: any, p: any) => p.margen_porcentaje > best.margen_porcentaje ? p : best, conReceta[0])
                : null
              const menosRentable = conReceta.length > 0
                ? conReceta.reduce((worst: any, p: any) => p.margen_porcentaje < worst.margen_porcentaje ? p : worst, conReceta[0])
                : null

              const getMargenColor = (porcentaje: number, tieneReceta: boolean) => {
                if (!tieneReceta) return 'text-muted-foreground'
                if (porcentaje > 50) return 'text-oliva'
                if (porcentaje >= 30) return 'text-mostaza'
                return 'text-rojo'
              }

              const toggleSort = (key: string) => {
                if (rentSortKey === key) {
                  setRentSortDir(rentSortDir === 'asc' ? 'desc' : 'asc')
                } else {
                  setRentSortKey(key)
                  setRentSortDir('desc')
                }
              }

              const sortedData = [...rentabilidadData].sort((a: any, b: any) => {
                const aVal = a[rentSortKey] ?? 0
                const bVal = b[rentSortKey] ?? 0
                return rentSortDir === 'asc' ? aVal - bVal : bVal - aVal
              })

              const SortIcon = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) => (
                <span className="ml-1 inline-block text-xs">
                  {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              )

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-oliva/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-oliva" /> Con Receta</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-oliva">{conReceta.length}</p></CardContent>
                    </Card>
                    <Card className="border-marron/5">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margen Promedio</CardTitle></CardHeader>
                      <CardContent><p className={`text-2xl font-bold ${margenPromedio > 50 ? 'text-oliva' : margenPromedio >= 30 ? 'text-mostaza' : 'text-rojo'}`}>{margenPromedio.toFixed(1)}%</p></CardContent>
                    </Card>
                    <Card className="border-oliva/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Más Rentable</CardTitle></CardHeader>
                      <CardContent>
                        {masRentable ? (
                          <>
                            <p className="text-sm font-bold text-marron truncate">{masRentable.nombre}</p>
                            <p className="text-lg font-bold text-oliva">{masRentable.margen_porcentaje.toFixed(1)}%</p>
                          </>
                        ) : <p className="text-sm text-muted-foreground">—</p>}
                      </CardContent>
                    </Card>
                    <Card className="border-rojo/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Menos Rentable</CardTitle></CardHeader>
                      <CardContent>
                        {menosRentable ? (
                          <>
                            <p className="text-sm font-bold text-marron truncate">{menosRentable.nombre}</p>
                            <p className="text-lg font-bold text-rojo">{menosRentable.margen_porcentaje.toFixed(1)}%</p>
                          </>
                        ) : <p className="text-sm text-muted-foreground">—</p>}
                      </CardContent>
                    </Card>
                    <Card className={sinReceta.length > 0 ? 'border-mostaza/30' : 'border-marron/5'}>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1">{sinReceta.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-mostaza" />} Sin Receta</CardTitle></CardHeader>
                      <CardContent><p className={`text-2xl font-bold ${sinReceta.length > 0 ? 'text-mostaza' : 'text-marron'}`}>{sinReceta.length}</p></CardContent>
                    </Card>
                  </div>

                  {/* Detailed Table */}
                  <Card className="border-marron/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base text-marron">Análisis de Rentabilidad por Producto</CardTitle>
                      <div className="flex gap-2">
                        <ExportadorExcel
                          data={rentabilidadData.map((p: any) => ({
                            producto: p.nombre,
                            receta: p.receta_nombre || 'Sin receta',
                            costo_mp: p.costo_ingredientes_mp,
                            costo_insumos: p.costo_ingredientes_insumos,
                            costo_total: p.costo_produccion,
                            precio_venta: p.precio_venta,
                            margen: p.margen,
                            margen_pct: p.margen_porcentaje.toFixed(1) + '%',
                          }))}
                          filename="rentabilidad_productos"
                          columns={[
                            { key: 'producto', header: 'Producto' },
                            { key: 'receta', header: 'Receta' },
                            { key: 'costo_mp', header: 'Costo MP' },
                            { key: 'costo_insumos', header: 'Costo Insumos' },
                            { key: 'costo_total', header: 'Costo Total' },
                            { key: 'precio_venta', header: 'Precio Venta' },
                            { key: 'margen', header: 'Margen ($)' },
                            { key: 'margen_pct', header: 'Margen (%)' },
                          ]}
                          modulo="reportes"
                        />
                        <ExportadorPDF
                          data={rentabilidadData.map((p: any) => ({
                            producto: p.nombre,
                            receta: p.receta_nombre || 'Sin receta',
                            costo_mp: formatPrice(p.costo_ingredientes_mp),
                            costo_insumos: formatPrice(p.costo_ingredientes_insumos),
                            costo_total: formatPrice(p.costo_produccion),
                            precio_venta: formatPrice(p.precio_venta),
                            margen: formatPrice(p.margen),
                            margen_pct: p.margen_porcentaje.toFixed(1) + '%',
                          }))}
                          filename="rentabilidad_productos"
                          title="Análisis de Rentabilidad por Producto"
                          columns={[
                            { key: 'producto', header: 'Producto' },
                            { key: 'receta', header: 'Receta' },
                            { key: 'costo_mp', header: 'Costo MP' },
                            { key: 'costo_insumos', header: 'Costo Insumos' },
                            { key: 'costo_total', header: 'Costo Total' },
                            { key: 'precio_venta', header: 'Precio Venta' },
                            { key: 'margen', header: 'Margen ($)' },
                            { key: 'margen_pct', header: 'Margen (%)' },
                          ]}
                          modulo="reportes"
                        />
                        <ExportadorCSV
                          data={rentabilidadData.map((p: any) => ({
                            producto: p.nombre,
                            receta: p.receta_nombre || 'Sin receta',
                            costo_mp: p.costo_ingredientes_mp,
                            costo_insumos: p.costo_ingredientes_insumos,
                            costo_total: p.costo_produccion,
                            precio_venta: p.precio_venta,
                            margen: p.margen,
                            margen_pct: p.margen_porcentaje.toFixed(1) + '%',
                          }))}
                          filename="rentabilidad_productos"
                          columns={[
                            { key: 'producto', header: 'Producto' },
                            { key: 'receta', header: 'Receta' },
                            { key: 'costo_mp', header: 'Costo MP' },
                            { key: 'costo_insumos', header: 'Costo Insumos' },
                            { key: 'costo_total', header: 'Costo Total' },
                            { key: 'precio_venta', header: 'Precio Venta' },
                            { key: 'margen', header: 'Margen ($)' },
                            { key: 'margen_pct', header: 'Margen (%)' },
                          ]}
                          modulo="reportes"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Receta</TableHead>
                              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('costo_ingredientes_mp')}>
                                Costo MP <SortIcon active={rentSortKey === 'costo_ingredientes_mp'} dir={rentSortDir} />
                              </TableHead>
                              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('costo_ingredientes_insumos')}>
                                Costo Insumos <SortIcon active={rentSortKey === 'costo_ingredientes_insumos'} dir={rentSortDir} />
                              </TableHead>
                              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('costo_produccion')}>
                                Costo Total <SortIcon active={rentSortKey === 'costo_produccion'} dir={rentSortDir} />
                              </TableHead>
                              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('precio_venta')}>
                                Precio Venta <SortIcon active={rentSortKey === 'precio_venta'} dir={rentSortDir} />
                              </TableHead>
                              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('margen')}>
                                Margen ($) <SortIcon active={rentSortKey === 'margen'} dir={rentSortDir} />
                              </TableHead>
                              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('margen_porcentaje')}>
                                Margen (%) <SortIcon active={rentSortKey === 'margen_porcentaje'} dir={rentSortDir} />
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedData.map((p: any) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.nombre}</TableCell>
                                <TableCell>
                                  {p.tiene_receta ? (
                                    <Badge variant="outline" className="text-xs">{p.receta_nombre}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs text-mostaza border-mostaza/30">Sin receta</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">{p.tiene_receta ? formatPrice(p.costo_ingredientes_mp) : '—'}</TableCell>
                                <TableCell className="text-right">{p.tiene_receta ? formatPrice(p.costo_ingredientes_insumos) : '—'}</TableCell>
                                <TableCell className="text-right">{p.tiene_receta ? formatPrice(p.costo_produccion) : '—'}</TableCell>
                                <TableCell className="text-right">{formatPrice(p.precio_venta)}</TableCell>
                                <TableCell className="text-right">{p.tiene_receta ? formatPrice(p.margen) : '—'}</TableCell>
                                <TableCell className={`text-right font-bold ${getMargenColor(p.margen_porcentaje, p.tiene_receta)}`}>
                                  {p.tiene_receta ? `${p.margen_porcentaje.toFixed(1)}%` : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )
            })()
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
