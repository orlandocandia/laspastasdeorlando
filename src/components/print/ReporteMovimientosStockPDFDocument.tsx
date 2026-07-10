'use client'

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

// ============================================
// TIPOS
// ============================================
export interface MovimientoStockItem {
  id: number
  tipo_movimiento: string
  cantidad: number
  stock_antes: number
  stock_despues: number
  referencia_id: number | null
  referencia_tabla: string | null
  observacion: string | null
  fecha_movimiento: string
  materiaPrima?: { id: number; nombre: string; codigo?: string | null } | null
  insumo?: { id: number; nombre: string; codigo?: string | null } | null
  productoTerminado?: { id: number; nombre: string; codigo?: string | null } | null
  unidad?: { id: number; codigo: string; nombre: string } | null
  usuario?: { id: number; persona?: { nombre: string; apellido: string } | null } | null
}

export interface ReporteMovimientosStockData {
  movimientos: MovimientoStockItem[]
  filtros?: {
    tipo_movimiento?: string | null
    fecha_desde?: string | null
    fecha_hasta?: string | null
  }
  total?: number
}

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
  cuit: '20-12345678-9',
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}
const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try { return new Date(dateStr).toLocaleString('es-AR') } catch { return dateStr }
}
const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n || 0)

const TIPO_LABELS: Record<string, string> = {
  compra: 'Compra',
  venta: 'Venta',
  produccion_consumo: 'Prod. Consumo',
  produccion_genera: 'Prod. Genera',
  ajuste_in: 'Ajuste (+)',
  ajuste_out: 'Ajuste (-)',
  devolucion: 'Devolucion',
}

const tipoLabel = (t: string) => TIPO_LABELS[t] || t

const getProducto = (m: MovimientoStockItem) =>
  m.materiaPrima?.nombre || m.insumo?.nombre || m.productoTerminado?.nombre || '-'

const getTipoItem = (m: MovimientoStockItem) => {
  if (m.materiaPrima) return 'MP'
  if (m.insumo) return 'INS'
  if (m.productoTerminado) return 'PT'
  return '-'
}

const getReferencia = (m: MovimientoStockItem) => {
  if (!m.referencia_tabla || !m.referencia_id) return '-'
  return `${m.referencia_tabla} #${m.referencia_id}`
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 28, paddingBottom: 56, paddingLeft: 28, fontSize: 9, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 14 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docSubtitulo: { fontSize: 10, color: COLORS.grisOscuro, marginTop: 2 },
  docFecha: { fontSize: 8, color: COLORS.grisOscuro, marginTop: 2 },
  filtrosBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 8, marginBottom: 12, flexDirection: 'row', gap: 12 },
  filtroItem: { fontSize: 9, color: COLORS.negro },
  filtroLabel: { fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  resumenBox: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  resumenCard: { flex: 1, backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 8, borderLeftWidth: 3, borderLeftColor: COLORS.mostaza },
  resumenLabel: { fontSize: 7, color: COLORS.grisOscuro, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  resumenValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  th: { padding: 5 },
  thFecha: { flex: 1.8 },
  thTipo: { flex: 1.4 },
  thItem: { flex: 0.5, textAlign: 'center' },
  thProd: { flex: 3 },
  thCant: { flex: 1.1, textAlign: 'right' },
  thAntes: { flex: 1.1, textAlign: 'right' },
  thDesp: { flex: 1.1, textAlign: 'right' },
  thRef: { flex: 1.6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 8 },
  td: { padding: 5 },
  tdFecha: { flex: 1.8 },
  tdTipo: { flex: 1.4 },
  tdItem: { flex: 0.5, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  tdProd: { flex: 3 },
  tdCant: { flex: 1.1, textAlign: 'right' },
  tdAntes: { flex: 1.1, textAlign: 'right' },
  tdDesp: { flex: 1.1, textAlign: 'right' },
  tdRef: { flex: 1.6 },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  cantPos: { color: COLORS.oliva, fontFamily: 'Helvetica-Bold' },
  cantNeg: { color: COLORS.rojo, fontFamily: 'Helvetica-Bold' },
  emptyBox: { padding: 20, textAlign: 'center', fontSize: 10, color: COLORS.grisOscuro, fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 24, left: 28, right: 28, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function ReporteMovimientosStockDocument({ data }: { data: ReporteMovimientosStockData }) {
  const fechaGen = new Date().toLocaleString('es-AR')
  const movs = data.movimientos || []
  const total = data.total ?? movs.length

  const entradas = movs.filter((m) => m.cantidad > 0).length
  const salidas = movs.filter((m) => m.cantidad < 0).length

  let alt = false

  const filtros = data.filtros || {}

  return (
    <Document title="Reporte de Movimientos de Stock" author={EMPRESA.nombre} subject="Reporte de Movimientos de Stock">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>REPORTE DE MOVIMIENTOS DE STOCK</Text>
            <Text style={styles.docSubtitulo}>{total} movimiento(s)</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        {/* Filtros aplicados */}
        <View style={styles.filtrosBox}>
          <Text style={styles.filtroItem}>
            <Text style={styles.filtroLabel}>Tipo: </Text>{filtros.tipo_movimiento ? tipoLabel(filtros.tipo_movimiento) : 'Todos'}
          </Text>
          <Text style={styles.filtroItem}>
            <Text style={styles.filtroLabel}>Desde: </Text>{formatDate(filtros.fecha_desde || null)}
          </Text>
          <Text style={styles.filtroItem}>
            <Text style={styles.filtroLabel}>Hasta: </Text>{formatDate(filtros.fecha_hasta || null)}
          </Text>
        </View>

        {/* Resumen */}
        <View style={styles.resumenBox}>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Total Movimientos</Text>
            <Text style={styles.resumenValue}>{total}</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Entradas (+)</Text>
            <Text style={[styles.resumenValue, { color: COLORS.oliva }]}>{entradas}</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Salidas (-)</Text>
            <Text style={[styles.resumenValue, { color: COLORS.rojo }]}>{salidas}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thFecha]}>Fecha</Text>
          <Text style={[styles.th, styles.thTipo]}>Tipo</Text>
          <Text style={[styles.th, styles.thItem]}>It.</Text>
          <Text style={[styles.th, styles.thProd]}>Producto</Text>
          <Text style={[styles.th, styles.thCant]}>Cantidad</Text>
          <Text style={[styles.th, styles.thAntes]}>Stock Ant.</Text>
          <Text style={[styles.th, styles.thDesp]}>Stock Desp.</Text>
          <Text style={[styles.th, styles.thRef]}>Referencia</Text>
        </View>
        {movs.length === 0 ? (
          <Text style={styles.emptyBox}>No hay movimientos de stock para los filtros seleccionados.</Text>
        ) : movs.map((m) => {
          const rowStyle = alt ? [styles.tableRow, styles.rowAlt] : [styles.tableRow]
          alt = !alt
          const cantStyle = m.cantidad >= 0 ? styles.cantPos : styles.cantNeg
          const signo = m.cantidad >= 0 ? '+' : ''
          return (
            <View key={m.id} style={rowStyle} wrap={false}>
              <Text style={[styles.td, styles.tdFecha]}>{formatDateTime(m.fecha_movimiento)}</Text>
              <Text style={[styles.td, styles.tdTipo]}>{tipoLabel(m.tipo_movimiento)}</Text>
              <Text style={[styles.td, styles.tdItem]}>{getTipoItem(m)}</Text>
              <Text style={[styles.td, styles.tdProd]}>{getProducto(m)}</Text>
              <Text style={[styles.td, styles.tdCant, cantStyle]}>{signo}{formatNumber(m.cantidad)} {m.unidad?.codigo || ''}</Text>
              <Text style={[styles.td, styles.tdAntes]}>{formatNumber(m.stock_antes)}</Text>
              <Text style={[styles.td, styles.tdDesp]}>{formatNumber(m.stock_despues)}</Text>
              <Text style={[styles.td, styles.tdRef]}>{getReferencia(m)}</Text>
            </View>
          )
        })}

        <View style={styles.footer} fixed>
          <Text>Reporte de Movimientos de Stock — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default ReporteMovimientosStockDocument
