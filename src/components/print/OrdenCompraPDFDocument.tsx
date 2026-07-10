'use client'

import {
  Document, Page, Text, View, StyleSheet,
  Image as PDFImage,
} from '@react-pdf/renderer'

// ============================================
// TIPOS
// ============================================
interface CompraDetalleItem {
  tipo: 'materia_prima' | 'insumo'
  nombre: string
  marca?: string | null
  cantidad: number
  unidad: string
  precio_unitario: number
  precio_total: number
  vencimiento?: string | null
  lote?: string | null
}

export interface OrdenCompraData {
  id: number
  numero_factura: string | null
  fecha_compra: string
  subtotal: number
  iva: number
  total: number
  observaciones?: string | null
  proveedor: string
  forma_pago: string
  estado: string
  detalle: CompraDetalleItem[]
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
  nombre: 'Pastas Orlando',
  direccion: 'Posadas, Misiones',
  telefono: '3754-419324',
  email: 'laspastasdeorlando@gmail.com',
  cuit: '20-12345678-9',
}

const formatDate = (dateStr: string) => {
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount || 0)

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36,
    fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16,
  },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docNumero: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 1 },
  estadoBadge: {
    fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco,
    backgroundColor: COLORS.mostaza, paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 3, marginTop: 4,
  },
  proveedorBox: {
    backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginBottom: 16,
  },
  boxTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  proveedorLine: { fontSize: 10, color: COLORS.negro, marginTop: 1 },
  condicionesBox: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  condicionCol: {
    flex: 1, backgroundColor: COLORS.crema, borderRadius: 4, padding: 8,
  },
  condicionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 2 },
  condicionValue: { fontSize: 10, color: COLORS.negro },
  sectionTitulo: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.marron,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco,
    fontFamily: 'Helvetica-Bold', fontSize: 9,
  },
  th: { padding: 6 },
  thTipo: { flex: 1, textAlign: 'center' },
  thNombre: { flex: 4 },
  thMarca: { flex: 2 },
  thCant: { flex: 1.3, textAlign: 'center' },
  thUnidad: { flex: 1.3, textAlign: 'center' },
  thVenc: { flex: 1.5, textAlign: 'center' },
  thLote: { flex: 1.5, textAlign: 'center' },
  thPrecioU: { flex: 1.8, textAlign: 'right' },
  thPrecioT: { flex: 1.8, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 9,
  },
  td: { padding: 6 },
  tdTipo: { flex: 1, textAlign: 'center' },
  tdNombre: { flex: 4 },
  tdMarca: { flex: 2 },
  tdCant: { flex: 1.3, textAlign: 'center' },
  tdUnidad: { flex: 1.3, textAlign: 'center' },
  tdVenc: { flex: 1.5, textAlign: 'center' },
  tdLote: { flex: 1.5, textAlign: 'center' },
  tdPrecioU: { flex: 1.8, textAlign: 'right' },
  tdPrecioT: { flex: 1.8, textAlign: 'right' },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  tipoMP: { color: COLORS.oliva, fontFamily: 'Helvetica-Bold' },
  tipoIns: { color: COLORS.mostaza, fontFamily: 'Helvetica-Bold' },
  totalesWrapper: {
    flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14,
  },
  totalesBox: { width: '45%' },
  totalLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3, fontSize: 10,
  },
  totalFinal: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, marginTop: 4, borderTopWidth: 2, borderTopColor: COLORS.marron,
    fontFamily: 'Helvetica-Bold', fontSize: 13, color: COLORS.marron,
  },
  obsBox: {
    backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, marginTop: 16,
  },
  obsTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  obsTexto: { fontSize: 10, color: COLORS.negro },
  entregaBox: {
    flexDirection: 'row', gap: 10, marginTop: 16,
  },
  entregaCol: {
    flex: 1, border: 1, borderColor: COLORS.grisOscuro, borderRadius: 4, padding: 8,
  },
  entregaLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 2 },
  entregaValue: { fontSize: 10, color: COLORS.negro },
  firmaRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 50,
  },
  firmaBox: { width: '40%' },
  firmaLine: { borderBottomWidth: 1, borderBottomColor: COLORS.negro, marginBottom: 4 },
  firmaLabel: { fontSize: 9, color: COLORS.grisOscuro, textAlign: 'center' },
  footer: {
    position: 'absolute', bottom: 24, left: 36, right: 36,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8,
    textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro,
  },
  qrBox: { position: 'absolute', bottom: 24, right: 36, width: 70, height: 70, alignItems: 'center' },
  qrImage: { width: 64, height: 64 },
  qrLabel: { fontSize: 6, color: COLORS.grisOscuro, marginTop: 2, textAlign: 'center' },
})

// ============================================
// DOCUMENTO
// ============================================
export function OrdenCompraPDFDocument({ compra, qrContent }: { compra: OrdenCompraData; qrContent?: string }) {
  const numero = compra.numero_factura || `OC-${String(compra.id).padStart(6, '0')}`
  return (
    <Document title={`Orden de Compra ${numero}`} author={EMPRESA.nombre} subject="Orden de Compra">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion}</Text>
            <Text style={styles.empresaLine}>Tel: {EMPRESA.telefono} — {EMPRESA.email}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>ORDEN DE COMPRA</Text>
            <Text style={styles.docNumero}>N° {numero}</Text>
            <Text style={styles.docFecha}>Fecha: {formatDate(compra.fecha_compra)}</Text>
            <Text style={styles.estadoBadge}>{compra.estado}</Text>
          </View>
        </View>

        {/* Proveedor */}
        <View style={styles.proveedorBox}>
          <Text style={styles.boxTitulo}>DATOS DEL PROVEEDOR</Text>
          <Text style={styles.proveedorLine}>{compra.proveedor}</Text>
          <Text style={styles.proveedorLine}>Forma de pago: {compra.forma_pago}</Text>
        </View>

        {/* Condiciones */}
        <View style={styles.condicionesBox}>
          <View style={styles.condicionCol}>
            <Text style={styles.condicionLabel}>CONDICION DE ENTREGA</Text>
            <Text style={styles.condicionValue}>A coordinar con el proveedor</Text>
          </View>
          <View style={styles.condicionCol}>
            <Text style={styles.condicionLabel}>FORMA DE PAGO</Text>
            <Text style={styles.condicionValue}>{compra.forma_pago}</Text>
          </View>
        </View>

        {/* Detalle table */}
        <Text style={styles.sectionTitulo}>DETALLE DE PRODUCTOS E INSUMOS SOLICITADOS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thTipo]}>Tipo</Text>
          <Text style={[styles.th, styles.thNombre]}>Producto</Text>
          <Text style={[styles.th, styles.thMarca]}>Marca</Text>
          <Text style={[styles.th, styles.thCant]}>Cant.</Text>
          <Text style={[styles.th, styles.thUnidad]}>Unidad</Text>
          <Text style={[styles.th, styles.thPrecioU]}>P. Unit.</Text>
          <Text style={[styles.th, styles.thPrecioT]}>P. Total</Text>
        </View>
        {compra.detalle.map((item, i) => (
          <View key={`d-${i}`} style={[styles.tableRow, i % 2 === 1 ? styles.rowAlt : {}]}>
            <Text style={[styles.td, styles.tdTipo, item.tipo === 'materia_prima' ? styles.tipoMP : styles.tipoIns]}>
              {item.tipo === 'materia_prima' ? 'MP' : 'Ins'}
            </Text>
            <Text style={[styles.td, styles.tdNombre]}>{item.nombre}</Text>
            <Text style={[styles.td, styles.tdMarca]}>{item.marca || '-'}</Text>
            <Text style={[styles.td, styles.tdCant]}>{item.cantidad}</Text>
            <Text style={[styles.td, styles.tdUnidad]}>{item.unidad}</Text>
            <Text style={[styles.td, styles.tdPrecioU]}>{formatCurrency(item.precio_unitario)}</Text>
            <Text style={[styles.td, styles.tdPrecioT]}>{formatCurrency(item.precio_total)}</Text>
          </View>
        ))}

        {/* Totales */}
        <View style={styles.totalesWrapper}>
          <View style={styles.totalesBox}>
            <View style={styles.totalLine}><Text>Subtotal:</Text><Text>{formatCurrency(compra.subtotal)}</Text></View>
            <View style={styles.totalLine}><Text>IVA (21%):</Text><Text>{formatCurrency(compra.iva)}</Text></View>
            <View style={styles.totalFinal}><Text>TOTAL:</Text><Text>{formatCurrency(compra.total)}</Text></View>
          </View>
        </View>

        {/* Datos de vencimiento/lote si hay */}
        {compra.detalle.some(d => d.vencimiento || d.lote) && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitulo}>DATOS DE LOTE Y VENCIMIENTO</Text>
            {compra.detalle.filter(d => d.vencimiento || d.lote).map((item, i) => (
              <View key={`vl-${i}`} style={{ flexDirection: 'row', fontSize: 9, paddingVertical: 2 }}>
                <Text style={{ flex: 4 }}>{item.nombre}</Text>
                <Text style={{ flex: 2 }}>{item.marca || '-'}</Text>
                <Text style={{ flex: 2 }}>Vto: {item.vencimiento ? formatDate(item.vencimiento) : '-'}</Text>
                <Text style={{ flex: 2 }}>Lote: {item.lote || '-'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Observaciones */}
        {compra.observaciones && (
          <View style={styles.obsBox}>
            <Text style={styles.obsTitulo}>OBSERVACIONES</Text>
            <Text style={styles.obsTexto}>{compra.observaciones}</Text>
          </View>
        )}

        {/* Condiciones de entrega */}
        <View style={styles.entregaBox}>
          <View style={styles.entregaCol}>
            <Text style={styles.entregaLabel}>LUGAR DE ENTREGA</Text>
            <Text style={styles.entregaValue}>{EMPRESA.direccion}</Text>
          </View>
          <View style={styles.entregaCol}>
            <Text style={styles.entregaLabel}>CONTACTO</Text>
            <Text style={styles.entregaValue}>{EMPRESA.telefono} — {EMPRESA.email}</Text>
          </View>
        </View>

        {/* Firmas */}
        <View style={styles.firmaRow}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaLabel}>Autorizado por — Firma y Aclaracion</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaLabel}>Recibido por Proveedor — Firma y Aclaracion</Text>
          </View>
        </View>

        {qrContent ? (
          <View style={styles.qrBox} fixed>
            <PDFImage style={styles.qrImage} src={qrContent} />
            <Text style={styles.qrLabel}>Escanear para verificar</Text>
          </View>
        ) : null}
        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Orden de Compra {numero} — {EMPRESA.nombre} — {EMPRESA.direccion} — CUIT: {EMPRESA.cuit}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default OrdenCompraPDFDocument
