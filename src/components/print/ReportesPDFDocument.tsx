'use client'

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

// ============================================
// CONSTANTES DE MARCA
// ============================================
const COLORS = {
  marron: '#5C3A21',
  mostaza: '#E1AD01',
  crema: '#FFF8E7',
  grisClaro: '#F3F4F6',
  grisOscuro: '#6B7280',
  blanco: '#FFFFFF',
  negro: '#111827',
  rojo: '#B91C1C',
  oliva: '#708238',
}

const EMPRESA = {
  nombre: 'El Amigo de las Pastas',
  direccion: 'Posadas, Misiones',
  telefono: '3754-419324',
  email: 'laspastasdeorlando@gmail.com',
  cuit: '20-12345678-9',
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount || 0)
const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n || 0)
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}
const formatDateTime = (date: Date) => {
  try { return date.toLocaleString('es-AR') } catch { return String(date) }
}

// ============================================
// ESTILOS COMPARTIDOS
// ============================================
const baseStyles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docSubtitulo: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 4 },
  filtrosBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 8, marginBottom: 14, fontSize: 9, color: COLORS.grisOscuro },
  filtrosText: { fontSize: 9, color: COLORS.marron },
  filtrosLabel: { fontFamily: 'Helvetica-Bold' },
  resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  resumenCard: { width: '32%', backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 8, borderLeftWidth: 3, borderLeftColor: COLORS.mostaza },
  resumenLabel: { fontSize: 8, color: COLORS.grisOscuro, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  resumenValor: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 3 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 14, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.mostaza, paddingBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  th: { padding: 5 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 9 },
  td: { padding: 5 },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
  emptyMsg: { fontSize: 10, color: COLORS.grisOscuro, fontStyle: 'italic', padding: 8, textAlign: 'center' },
})

// ============================================
// TIPOS DE DATOS DE REPORTES
// ============================================
export interface ReporteVentasData {
  resumen: {
    totalVentas: number
    cantidadVentas: number
    ticketPromedio: number
  }
  productosMasVendidos: Array<{ nombre: string; cantidad: number; subtotal: number }>
  clientesMasFrecuentes: Array<{ nombre: string; compras: number; total: number }>
  ventasPorVendedor?: Array<{ nombre: string; ventas: number; total: number }>
  ventasPorDia: Array<{ fecha: string; cantidad: number; total: number }>
  ventas?: Array<{
    id: number
    fecha_venta: string
    cliente: { razon_social: string | null; nombre: string; apellido: string }
    vendedor?: { persona?: { nombre: string; apellido: string } } | null
    total: number
    estado?: { nombre_estado: string } | null
  }>
  filtros?: { fechaDesde?: string; fechaHasta?: string; producto?: string; cliente?: string; vendedor?: string }
}

export interface ReporteStockData {
  resumen: {
    valorStockTotal: number
    valorStockMP: number
    valorStockInsumos: number
    valorStockPT: number
    stockCriticoMP: number
    stockCriticoInsumos: number
    stockCriticoPT: number
  }
  alertasStock: Array<{ tipo: string; nombre: string; stock_actual: number; stock_minimo: number; unidad: string }>
  productosTerminados: Array<{
    nombre: string
    categoria?: { nombre: string } | null
    stock_actual: number
    stock_minimo: number
    precio_venta: number
  }>
  materiasPrimas: Array<{
    nombre: string
    categoria?: { nombre: string } | null
    stock_actual: number
    stock_minimo: number
    precio_compra_referencia: number
    unidadBase?: { codigo: string } | null
  }>
  insumos: Array<{
    nombre: string
    tipoInsumo?: { nombre: string } | null
    stock_actual: number
    stock_minimo: number
    precio_compra_referencia: number
    unidadBase?: { codigo: string } | null
  }>
  filtros?: { categoriaPT?: string; categoriaMP?: string; proveedor?: string; soloStockBajo?: boolean }
}

export interface ReporteProduccionData {
  resumen: {
    totalProducido: number
    costoTotal: number
    costoPromedio: number
  }
  costosPorProducto: Array<{ producto: string; producido: number; costoTotal: number; costoPromedio: number }>
  producciones?: Array<{
    id: number
    fecha_produccion: string
    receta?: { nombre_receta: string; productoTerminado?: { nombre: string } | null } | null
    cantidad_producida: number
    costo_total: number
    supervisor?: { nombre: string; apellido: string } | null
    estado?: { nombre_estado: string } | null
  }>
  filtros?: { fechaDesde?: string; fechaHasta?: string; producto?: string }
}

export interface ReporteComprasData {
  resumen: {
    totalCompras: number
    cantidadCompras: number
    promedioCompra: number
  }
  proveedoresMasUtilizados: Array<{ nombre: string; compras: number; total: number }>
  productosMasComprados: Array<{ nombre: string; cantidad: number; total: number }>
  filtros?: { fechaDesde?: string; fechaHasta?: string }
}

// ============================================
// Helper para renderizar filtros
// ============================================
function FiltrosBox({ filtros }: { filtros?: Record<string, string | boolean | undefined> }) {
  if (!filtros) return null
  const entries = Object.entries(filtros).filter(([, v]) => v)
  if (entries.length === 0) return null
  return (
    <View style={baseStyles.filtrosBox}>
      <Text style={baseStyles.filtrosText}>
        <Text style={baseStyles.filtrosLabel}>Filtros aplicados: </Text>
        {entries.map(([k, v]) => `${k}: ${v}`).join(' | ')}
      </Text>
    </View>
  )
}

// ============================================
// REPORTE DE VENTAS
// ============================================
function ReporteVentasDocument({ data }: { data: ReporteVentasData }) {
  const fechaGen = formatDateTime(new Date())
  return (
    <Document title="Reporte de Ventas" author={EMPRESA.nombre} subject="Reporte de Ventas">
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <View style={baseStyles.empresaBlock}>
            <Text style={baseStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={baseStyles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={baseStyles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={baseStyles.docBlock}>
            <Text style={baseStyles.docTitulo}>REPORTE DE VENTAS</Text>
            <Text style={baseStyles.docSubtitulo}>Análisis de ventas</Text>
            <Text style={baseStyles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        <FiltrosBox filtros={data.filtros} />

        <View style={baseStyles.resumenGrid}>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Total Ventas</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.totalVentas)}</Text>
          </View>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Cantidad</Text>
            <Text style={baseStyles.resumenValor}>{data.resumen.cantidadVentas}</Text>
          </View>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Ticket Promedio</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.ticketPromedio)}</Text>
          </View>
        </View>

        <Text style={baseStyles.sectionTitle}>Productos Más Vendidos</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 6 }]}>Producto</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Cantidad</Text>
          <Text style={[baseStyles.th, { flex: 3, textAlign: 'right' }]}>Subtotal</Text>
        </View>
        {data.productosMasVendidos.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos</Text>
        ) : (
          data.productosMasVendidos.map((p, i) => (
            <View key={`pv-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 6 }]}>{p.nombre}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatNumber(p.cantidad)}</Text>
              <Text style={[baseStyles.td, { flex: 3, textAlign: 'right' }]}>{formatCurrency(p.subtotal)}</Text>
            </View>
          ))
        )}

        <Text style={baseStyles.sectionTitle}>Clientes Más Frecuentes</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 6 }]}>Cliente</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Compras</Text>
          <Text style={[baseStyles.th, { flex: 3, textAlign: 'right' }]}>Total</Text>
        </View>
        {data.clientesMasFrecuentes.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos</Text>
        ) : (
          data.clientesMasFrecuentes.map((c, i) => (
            <View key={`cf-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 6 }]}>{c.nombre}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{c.compras}</Text>
              <Text style={[baseStyles.td, { flex: 3, textAlign: 'right' }]}>{formatCurrency(c.total)}</Text>
            </View>
          ))
        )}

        {data.ventasPorVendedor && data.ventasPorVendedor.length > 0 && (
          <>
            <Text style={baseStyles.sectionTitle}>Ventas por Vendedor</Text>
            <View style={baseStyles.tableHeader}>
              <Text style={[baseStyles.th, { flex: 6 }]}>Vendedor</Text>
              <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>N° Ventas</Text>
              <Text style={[baseStyles.th, { flex: 3, textAlign: 'right' }]}>Total</Text>
            </View>
            {data.ventasPorVendedor.map((v, i) => (
              <View key={`vv-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
                <Text style={[baseStyles.td, { flex: 6 }]}>{v.nombre}</Text>
                <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{v.ventas}</Text>
                <Text style={[baseStyles.td, { flex: 3, textAlign: 'right' }]}>{formatCurrency(v.total)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={baseStyles.sectionTitle}>Ventas por Día</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 5 }]}>Fecha</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Cantidad</Text>
          <Text style={[baseStyles.th, { flex: 3, textAlign: 'right' }]}>Total</Text>
        </View>
        {data.ventasPorDia.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos</Text>
        ) : (
          data.ventasPorDia.slice(0, 30).map((d, i) => (
            <View key={`vd-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 5 }]}>{d.fecha}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{d.cantidad}</Text>
              <Text style={[baseStyles.td, { flex: 3, textAlign: 'right' }]}>{formatCurrency(d.total)}</Text>
            </View>
          ))
        )}

        <View style={baseStyles.footer} fixed>
          <Text>Reporte de Ventas — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================
// REPORTE DE STOCK
// ============================================
function ReporteStockDocument({ data }: { data: ReporteStockData }) {
  const fechaGen = formatDateTime(new Date())
  const totalAlertas = data.resumen.stockCriticoMP + data.resumen.stockCriticoInsumos + data.resumen.stockCriticoPT
  return (
    <Document title="Reporte de Stock" author={EMPRESA.nombre} subject="Reporte de Stock e Inventario">
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <View style={baseStyles.empresaBlock}>
            <Text style={baseStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={baseStyles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={baseStyles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={baseStyles.docBlock}>
            <Text style={baseStyles.docTitulo}>REPORTE DE STOCK</Text>
            <Text style={baseStyles.docSubtitulo}>Inventario actual</Text>
            <Text style={baseStyles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        <FiltrosBox filtros={data.filtros} />

        <View style={baseStyles.resumenGrid}>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Valor Stock Total</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.valorStockTotal)}</Text>
          </View>
          <View style={[baseStyles.resumenCard, { borderLeftColor: totalAlertas > 0 ? COLORS.rojo : COLORS.mostaza }]}>
            <Text style={baseStyles.resumenLabel}>Stock Crítico</Text>
            <Text style={[baseStyles.resumenValor, { color: totalAlertas > 0 ? COLORS.rojo : COLORS.marron }]}>{totalAlertas}</Text>
          </View>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Valor MP + Insumos</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.valorStockMP + data.resumen.valorStockInsumos)}</Text>
          </View>
        </View>

        {data.alertasStock.length > 0 && (
          <>
            <Text style={[baseStyles.sectionTitle, { color: COLORS.rojo }]}>Alertas de Stock Bajo ({data.alertasStock.length})</Text>
            <View style={[baseStyles.tableHeader, { backgroundColor: COLORS.rojo }]}>
              <Text style={[baseStyles.th, { flex: 3 }]}>Tipo</Text>
              <Text style={[baseStyles.th, { flex: 5 }]}>Nombre</Text>
              <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Actual</Text>
              <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Mínimo</Text>
            </View>
            {data.alertasStock.map((a, i) => (
              <View key={`al-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
                <Text style={[baseStyles.td, { flex: 3 }]}>{a.tipo}</Text>
                <Text style={[baseStyles.td, { flex: 5 }]}>{a.nombre}</Text>
                <Text style={[baseStyles.td, { flex: 2, textAlign: 'right', color: COLORS.rojo, fontFamily: 'Helvetica-Bold' }]}>{formatNumber(a.stock_actual)} {a.unidad}</Text>
                <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatNumber(a.stock_minimo)} {a.unidad}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={baseStyles.sectionTitle}>Stock de Productos Terminados ({data.productosTerminados.length})</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 5 }]}>Producto</Text>
          <Text style={[baseStyles.th, { flex: 3 }]}>Categoría</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Stock</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Mín.</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Valor</Text>
        </View>
        {data.productosTerminados.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos</Text>
        ) : (
          data.productosTerminados.slice(0, 25).map((p, i) => (
            <View key={`pt-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 5 }]}>{p.nombre}</Text>
              <Text style={[baseStyles.td, { flex: 3 }]}>{p.categoria?.nombre || '-'}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right', color: p.stock_actual <= p.stock_minimo ? COLORS.rojo : COLORS.negro, fontFamily: p.stock_actual <= p.stock_minimo ? 'Helvetica-Bold' : 'Helvetica' }]}>{formatNumber(p.stock_actual)}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatNumber(p.stock_minimo)}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatCurrency(p.stock_actual * p.precio_venta)}</Text>
            </View>
          ))
        )}

        <Text style={baseStyles.sectionTitle}>Stock de Materias Primas ({data.materiasPrimas.length})</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 6 }]}>Materia Prima</Text>
          <Text style={[baseStyles.th, { flex: 3 }]}>Categoría</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Stock</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Mín.</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Valor</Text>
        </View>
        {data.materiasPrimas.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos</Text>
        ) : (
          data.materiasPrimas.slice(0, 20).map((m, i) => (
            <View key={`mp-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 6 }]}>{m.nombre}</Text>
              <Text style={[baseStyles.td, { flex: 3 }]}>{m.categoria?.nombre || '-'}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right', color: m.stock_actual <= m.stock_minimo ? COLORS.rojo : COLORS.negro, fontFamily: m.stock_actual <= m.stock_minimo ? 'Helvetica-Bold' : 'Helvetica' }]}>{formatNumber(m.stock_actual)} {m.unidadBase?.codigo || ''}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatNumber(m.stock_minimo)}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatCurrency(m.stock_actual * m.precio_compra_referencia)}</Text>
            </View>
          ))
        )}

        <Text style={baseStyles.sectionTitle}>Stock de Insumos ({data.insumos.length})</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 6 }]}>Insumo</Text>
          <Text style={[baseStyles.th, { flex: 3 }]}>Tipo</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Stock</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Mín.</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Valor</Text>
        </View>
        {data.insumos.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos</Text>
        ) : (
          data.insumos.slice(0, 20).map((ins, i) => (
            <View key={`in-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 6 }]}>{ins.nombre}</Text>
              <Text style={[baseStyles.td, { flex: 3 }]}>{ins.tipoInsumo?.nombre || '-'}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right', color: ins.stock_actual <= ins.stock_minimo ? COLORS.rojo : COLORS.negro, fontFamily: ins.stock_actual <= ins.stock_minimo ? 'Helvetica-Bold' : 'Helvetica' }]}>{formatNumber(ins.stock_actual)} {ins.unidadBase?.codigo || ''}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatNumber(ins.stock_minimo)}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatCurrency(ins.stock_actual * ins.precio_compra_referencia)}</Text>
            </View>
          ))
        )}

        <View style={baseStyles.footer} fixed>
          <Text>Reporte de Stock — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================
// REPORTE DE PRODUCCIÓN
// ============================================
function ReporteProduccionDocument({ data }: { data: ReporteProduccionData }) {
  const fechaGen = formatDateTime(new Date())
  return (
    <Document title="Reporte de Producción" author={EMPRESA.nombre} subject="Reporte de Producción">
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <View style={baseStyles.empresaBlock}>
            <Text style={baseStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={baseStyles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={baseStyles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={baseStyles.docBlock}>
            <Text style={baseStyles.docTitulo}>REPORTE DE PRODUCCIÓN</Text>
            <Text style={baseStyles.docSubtitulo}>Análisis de producción</Text>
            <Text style={baseStyles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        <FiltrosBox filtros={data.filtros} />

        <View style={baseStyles.resumenGrid}>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Total Producido</Text>
            <Text style={baseStyles.resumenValor}>{formatNumber(data.resumen.totalProducido)} u.</Text>
          </View>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Costo Total</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.costoTotal)}</Text>
          </View>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Costo Promedio</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.costoPromedio)}/u</Text>
          </View>
        </View>

        <Text style={baseStyles.sectionTitle}>Costos por Producto</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 5 }]}>Producto</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Producido</Text>
          <Text style={[baseStyles.th, { flex: 2.5, textAlign: 'right' }]}>Costo Total</Text>
          <Text style={[baseStyles.th, { flex: 2.5, textAlign: 'right' }]}>Costo Prom.</Text>
        </View>
        {data.costosPorProducto.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos para los filtros seleccionados</Text>
        ) : (
          data.costosPorProducto.map((c, i) => (
            <View key={`cp-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 5 }]}>{c.producto}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatNumber(c.producido)} u.</Text>
              <Text style={[baseStyles.td, { flex: 2.5, textAlign: 'right' }]}>{formatCurrency(c.costoTotal)}</Text>
              <Text style={[baseStyles.td, { flex: 2.5, textAlign: 'right' }]}>{formatCurrency(c.costoPromedio)}</Text>
            </View>
          ))
        )}

        {data.producciones && data.producciones.length > 0 && (
          <>
            <Text style={baseStyles.sectionTitle}>Detalle de Producciones ({data.producciones.length})</Text>
            <View style={baseStyles.tableHeader}>
              <Text style={[baseStyles.th, { flex: 1 }]}>N°</Text>
              <Text style={[baseStyles.th, { flex: 2 }]}>Fecha</Text>
              <Text style={[baseStyles.th, { flex: 4 }]}>Producto</Text>
              <Text style={[baseStyles.th, { flex: 1.5, textAlign: 'right' }]}>Cant.</Text>
              <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Costo</Text>
              <Text style={[baseStyles.th, { flex: 1.5 }]}>Estado</Text>
            </View>
            {data.producciones.slice(0, 30).map((p, i) => (
              <View key={`dp-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
                <Text style={[baseStyles.td, { flex: 1 }]}>{p.id}</Text>
                <Text style={[baseStyles.td, { flex: 2 }]}>{formatDate(p.fecha_produccion)}</Text>
                <Text style={[baseStyles.td, { flex: 4 }]}>{p.receta?.productoTerminado?.nombre || p.receta?.nombre_receta || '-'}</Text>
                <Text style={[baseStyles.td, { flex: 1.5, textAlign: 'right' }]}>{formatNumber(p.cantidad_producida)}</Text>
                <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatCurrency(p.costo_total)}</Text>
                <Text style={[baseStyles.td, { flex: 1.5 }]}>{p.estado?.nombre_estado || '-'}</Text>
              </View>
            ))}
          </>
        )}

        <View style={baseStyles.footer} fixed>
          <Text>Reporte de Producción — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================
// REPORTE DE COMPRAS
// ============================================
function ReporteComprasDocument({ data }: { data: ReporteComprasData }) {
  const fechaGen = formatDateTime(new Date())
  return (
    <Document title="Reporte de Compras" author={EMPRESA.nombre} subject="Reporte de Compras">
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <View style={baseStyles.empresaBlock}>
            <Text style={baseStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={baseStyles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={baseStyles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={baseStyles.docBlock}>
            <Text style={baseStyles.docTitulo}>REPORTE DE COMPRAS</Text>
            <Text style={baseStyles.docSubtitulo}>Análisis de compras</Text>
            <Text style={baseStyles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        <FiltrosBox filtros={data.filtros} />

        <View style={baseStyles.resumenGrid}>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Total Compras</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.totalCompras)}</Text>
          </View>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Cantidad</Text>
            <Text style={baseStyles.resumenValor}>{data.resumen.cantidadCompras}</Text>
          </View>
          <View style={baseStyles.resumenCard}>
            <Text style={baseStyles.resumenLabel}>Promedio</Text>
            <Text style={baseStyles.resumenValor}>{formatCurrency(data.resumen.promedioCompra)}</Text>
          </View>
        </View>

        <Text style={baseStyles.sectionTitle}>Proveedores Más Utilizados</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 6 }]}>Proveedor</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Compras</Text>
          <Text style={[baseStyles.th, { flex: 3, textAlign: 'right' }]}>Total</Text>
        </View>
        {data.proveedoresMasUtilizados.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos para los filtros seleccionados</Text>
        ) : (
          data.proveedoresMasUtilizados.map((p, i) => (
            <View key={`pu-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 6 }]}>{p.nombre}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{p.compras}</Text>
              <Text style={[baseStyles.td, { flex: 3, textAlign: 'right' }]}>{formatCurrency(p.total)}</Text>
            </View>
          ))
        )}

        <Text style={baseStyles.sectionTitle}>Productos Más Comprados</Text>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.th, { flex: 6 }]}>Producto</Text>
          <Text style={[baseStyles.th, { flex: 2, textAlign: 'right' }]}>Cantidad</Text>
          <Text style={[baseStyles.th, { flex: 3, textAlign: 'right' }]}>Total</Text>
        </View>
        {data.productosMasComprados.length === 0 ? (
          <Text style={baseStyles.emptyMsg}>Sin datos para los filtros seleccionados</Text>
        ) : (
          data.productosMasComprados.map((p, i) => (
            <View key={`pc-${i}`} style={[baseStyles.tableRow, i % 2 === 1 ? baseStyles.rowAlt : {}]}>
              <Text style={[baseStyles.td, { flex: 6 }]}>{p.nombre}</Text>
              <Text style={[baseStyles.td, { flex: 2, textAlign: 'right' }]}>{formatNumber(p.cantidad)}</Text>
              <Text style={[baseStyles.td, { flex: 3, textAlign: 'right' }]}>{formatCurrency(p.total)}</Text>
            </View>
          ))
        )}

        <View style={baseStyles.footer} fixed>
          <Text>Reporte de Compras — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export {
  ReporteVentasDocument,
  ReporteStockDocument,
  ReporteProduccionDocument,
  ReporteComprasDocument,
}
