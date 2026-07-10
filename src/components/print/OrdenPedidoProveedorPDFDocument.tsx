'use client'

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

// ============================================
// TIPOS
// ============================================
interface DetallePedidoProveedorItem {
  id: number
  id_materia_prima: number | null
  id_insumo: number | null
  cantidad_pedida: number
  precio_estimado: number
  materiaPrima?: { id: number; nombre: string; codigo?: string | null } | null
  insumo?: { id: number; nombre: string; codigo?: string | null } | null
  unidad: { id: number; codigo: string; nombre: string }
}

export interface PedidoProveedorDocData {
  id: number
  fecha_pedido: string
  fecha_entrega_estimada: string | null
  fecha_entrega_real: string | null
  observaciones: string | null
  total_estimado: number
  createdAt: string
  proveedor: {
    id: number
    nombre: string
    apellido: string
    razon_social: string | null
    numero_documento: string | null
    tipo_persona: string | null
  }
  estado?: { id: number; nombre_estado: string; es_final?: boolean } | null
  detalle: DetallePedidoProveedorItem[]
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
  email: 'laspastasdeorlando@gmail.com',
  cuit: '20-12345678-9',
  condicionIVA: 'Responsable Inscripto',
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount || 0)
const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n || 0)

const getProveedorNombre = (p: PedidoProveedorDocData['proveedor']) =>
  (p.razon_social || `${p.nombre} ${p.apellido}`.trim()).trim()

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 56, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docNumero: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 1 },
  estadoBadge: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, backgroundColor: COLORS.mostaza, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, marginTop: 6 },
  proveedorBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginBottom: 12 },
  boxTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4, textTransform: 'uppercase' },
  proveedorLine: { fontSize: 10, color: COLORS.negro, marginTop: 1 },
  infoBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoCol: { flex: 1, backgroundColor: COLORS.crema, borderRadius: 4, padding: 8 },
  infoLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 2 },
  infoValor: { fontSize: 10, color: COLORS.negro },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  th: { padding: 6 },
  thTipo: { flex: 1.2 },
  thProd: { flex: 4 },
  thCant: { flex: 1.5, textAlign: 'center' },
  thUnidad: { flex: 1.5, textAlign: 'center' },
  thPrecio: { flex: 2, textAlign: 'right' },
  thSub: { flex: 2, textAlign: 'right' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 10 },
  td: { padding: 6 },
  tdTipo: { flex: 1.2 },
  tdProd: { flex: 4 },
  tdCant: { flex: 1.5, textAlign: 'center' },
  tdUnidad: { flex: 1.5, textAlign: 'center' },
  tdPrecio: { flex: 2, textAlign: 'right' },
  tdSub: { flex: 2, textAlign: 'right' },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  totalesWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  totalesBox: { width: '45%' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 10, color: COLORS.grisOscuro },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginTop: 4, borderTopWidth: 2, borderTopColor: COLORS.marron, fontFamily: 'Helvetica-Bold', fontSize: 13, color: COLORS.marron },
  obsBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, marginTop: 16 },
  obsTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4, textTransform: 'uppercase' },
  obsTexto: { fontSize: 10, color: COLORS.negro },
  condBox: { marginTop: 14, padding: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4 },
  condTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4, textTransform: 'uppercase' },
  condTexto: { fontSize: 9, color: COLORS.grisOscuro },
  firmaBox: { flexDirection: 'row', gap: 20, marginTop: 30 },
  firmaCol: { flex: 1 },
  firmaLine: { borderTopWidth: 1, borderTopColor: COLORS.negro, paddingTop: 4, textAlign: 'center', fontSize: 9, color: COLORS.grisOscuro },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function OrdenPedidoProveedorDocument({ data: pedido }: { data: PedidoProveedorDocData }) {
  const numero = `PP-${String(pedido.id).padStart(6, '0')}`
  const fechaGen = new Date().toLocaleString('es-AR')

  const rows = pedido.detalle || []
  let alt = false

  return (
    <Document title={`Orden de Pedido a Proveedor ${numero}`} author={EMPRESA.nombre} subject="Orden de Pedido a Proveedor">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={{ fontSize: 9, color: COLORS.mostaza, fontStyle: 'italic', marginTop: 1 }}>Pastas artesanales con sabor a tradición</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion}</Text>
            <Text style={styles.empresaLine}>Tel: {EMPRESA.telefono} — {EMPRESA.email}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit} — {EMPRESA.condicionIVA}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>ORDEN DE PEDIDO</Text>
            <Text style={styles.docNumero}>{numero}</Text>
            <Text style={styles.docFecha}>Emitido: {formatDate(pedido.fecha_pedido)}</Text>
            {pedido.estado ? (
              <Text style={styles.estadoBadge}>{pedido.estado.nombre_estado}</Text>
            ) : null}
          </View>
        </View>

        {/* Proveedor */}
        <View style={styles.proveedorBox}>
          <Text style={styles.boxTitulo}>Proveedor</Text>
          <Text style={styles.proveedorLine}>{getProveedorNombre(pedido.proveedor)}</Text>
          {pedido.proveedor.numero_documento ? (
            <Text style={styles.proveedorLine}>Documento: {pedido.proveedor.numero_documento}</Text>
          ) : null}
          {pedido.proveedor.tipo_persona ? (
            <Text style={styles.proveedorLine}>Tipo: {pedido.proveedor.tipo_persona}</Text>
          ) : null}
        </View>

        {/* Info de entrega */}
        <View style={styles.infoBox}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Fecha de Pedido</Text>
            <Text style={styles.infoValor}>{formatDate(pedido.fecha_pedido)}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Entrega Estimada</Text>
            <Text style={styles.infoValor}>{formatDate(pedido.fecha_entrega_estimada)}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Entrega Real</Text>
            <Text style={styles.infoValor}>{formatDate(pedido.fecha_entrega_real)}</Text>
          </View>
        </View>

        {/* Tabla de items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thTipo]}>Tipo</Text>
          <Text style={[styles.th, styles.thProd]}>Producto</Text>
          <Text style={[styles.th, styles.thCant]}>Cantidad</Text>
          <Text style={[styles.th, styles.thUnidad]}>Unidad</Text>
          <Text style={[styles.th, styles.thPrecio]}>P. Estimado</Text>
          <Text style={[styles.th, styles.thSub]}>Subtotal</Text>
        </View>
        {rows.length === 0 ? (
          <Text style={{ padding: 10, fontSize: 10, color: COLORS.grisOscuro, fontStyle: 'italic' }}>
            Sin items de detalle
          </Text>
        ) : rows.map((d) => {
          const rowStyle = alt ? [styles.tableRow, styles.rowAlt] : [styles.tableRow]
          alt = !alt
          const nombre = d.materiaPrima?.nombre || d.insumo?.nombre || '-'
          const tipoLabel = d.id_materia_prima ? 'Materia Prima' : d.id_insumo ? 'Insumo' : '-'
          const subtotal = (d.cantidad_pedida || 0) * (d.precio_estimado || 0)
          return (
            <View key={d.id} style={rowStyle} wrap={false}>
              <Text style={[styles.td, styles.tdTipo]}>{tipoLabel}</Text>
              <Text style={[styles.td, styles.tdProd]}>{nombre}</Text>
              <Text style={[styles.td, styles.tdCant]}>{formatNumber(d.cantidad_pedida)}</Text>
              <Text style={[styles.td, styles.tdUnidad]}>{d.unidad?.codigo || '-'}</Text>
              <Text style={[styles.td, styles.tdPrecio]}>{formatCurrency(d.precio_estimado)}</Text>
              <Text style={[styles.td, styles.tdSub]}>{formatCurrency(subtotal)}</Text>
            </View>
          )
        })}

        {/* Totales */}
        <View style={styles.totalesWrapper}>
          <View style={styles.totalesBox}>
            <View style={styles.totalLine}>
              <Text>Subtotal estimado:</Text>
              <Text>{formatCurrency(pedido.total_estimado)}</Text>
            </View>
            <View style={styles.totalFinal}>
              <Text>TOTAL ESTIMADO</Text>
              <Text>{formatCurrency(pedido.total_estimado)}</Text>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        {pedido.observaciones ? (
          <View style={styles.obsBox}>
            <Text style={styles.obsTitulo}>Observaciones</Text>
            <Text style={styles.obsTexto}>{pedido.observaciones}</Text>
          </View>
        ) : null}

        {/* Condiciones de entrega */}
        <View style={styles.condBox}>
          <Text style={styles.condTitulo}>Condiciones de Entrega</Text>
          <Text style={styles.condTexto}>
            La presente orden de pedido esta sujeta a confirmacion de stock y precios por parte del proveedor.
            La mercaderia debe entregarse en condiciones optimas y con la documentacion correspondiente.
            Cualquier diferencia debe ser notificada dentro de las 48 hs. de recibida la mercaderia.
          </Text>
        </View>

        {/* Firmas */}
        <View style={styles.firmaBox}>
          <View style={styles.firmaCol}>
            <Text style={styles.firmaLine}>Firma Proveedor</Text>
          </View>
          <View style={styles.firmaCol}>
            <Text style={styles.firmaLine}>Firma {EMPRESA.nombre}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Orden de Pedido a Proveedor {numero} — {getProveedorNombre(pedido.proveedor)} — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default OrdenPedidoProveedorDocument
