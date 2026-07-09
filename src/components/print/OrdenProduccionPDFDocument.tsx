'use client'

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

// ============================================
// TIPOS
// ============================================
interface ConsumoItem {
  tipo: 'materia_prima' | 'insumo'
  nombre: string
  cantidad: number
  unidad: string
  costo_unitario: number
  costo_total: number
}

interface GeneradoItem {
  nombre: string
  cantidad: number
  costo_unitario: number
  costo_total: number
}

export interface OrdenProduccionData {
  id: number
  producto: string
  cantidad_producida: number
  fecha_produccion: string
  estado: string
  observaciones?: string | null
  supervisor?: string | null
  receta_nombre?: string | null
  consumos: ConsumoItem[]
  generados: GeneradoItem[]
  costo_materias_primas: number
  costo_insumos: number
  costo_total: number
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
}

const formatDate = (dateStr: string) => {
  try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR') } catch { return dateStr }
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
  docTitulo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docNumero: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 1 },
  estadoBadge: {
    fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco,
    backgroundColor: COLORS.mostaza, paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 3, marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  infoCard: {
    flex: 1, backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10,
  },
  infoLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.grisOscuro, marginBottom: 3 },
  infoValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  sectionTitulo: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.marron,
    marginBottom: 6, marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco,
    fontFamily: 'Helvetica-Bold', fontSize: 9,
  },
  th: { padding: 6 },
  thNombre: { flex: 4 },
  thTipo: { flex: 1.5, textAlign: 'center' },
  thCant: { flex: 1.5, textAlign: 'center' },
  thUnidad: { flex: 1.5, textAlign: 'center' },
  thCostoU: { flex: 2, textAlign: 'right' },
  thCostoT: { flex: 2, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 9,
  },
  td: { padding: 6 },
  tdNombre: { flex: 4 },
  tdTipo: { flex: 1.5, textAlign: 'center' },
  tdCant: { flex: 1.5, textAlign: 'center' },
  tdUnidad: { flex: 1.5, textAlign: 'center' },
  tdCostoU: { flex: 2, textAlign: 'right' },
  tdCostoT: { flex: 2, textAlign: 'right' },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  tipoMP: { color: COLORS.oliva, fontFamily: 'Helvetica-Bold' },
  tipoIns: { color: COLORS.mostaza, fontFamily: 'Helvetica-Bold' },
  costosBox: {
    flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14,
  },
  costosInner: { width: '50%' },
  costosLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3, fontSize: 10,
  },
  costosFinal: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, marginTop: 4, borderTopWidth: 2, borderTopColor: COLORS.marron,
    fontFamily: 'Helvetica-Bold', fontSize: 13, color: COLORS.marron,
  },
  obsBox: {
    backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, marginTop: 16,
  },
  obsTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  obsTexto: { fontSize: 10, color: COLORS.negro },
  firmaRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 60,
  },
  firmaBox: { width: '40%' },
  firmaLine: { borderBottomWidth: 1, borderBottomColor: COLORS.negro, marginBottom: 4 },
  firmaLabel: { fontSize: 9, color: COLORS.grisOscuro, textAlign: 'center' },
  footer: {
    position: 'absolute', bottom: 24, left: 36, right: 36,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8,
    textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro,
  },
})

// ============================================
// DOCUMENTO
// ============================================
export function OrdenProduccionPDFDocument({ orden }: { orden: OrdenProduccionData }) {
  const numero = `OP-${String(orden.id).padStart(6, '0')}`
  return (
    <Document title={`Orden de Produccion ${numero}`} author={EMPRESA.nombre} subject="Orden de Produccion">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion}</Text>
            <Text style={styles.empresaLine}>Tel: {EMPRESA.telefono} — {EMPRESA.email}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>ORDEN DE PRODUCCION</Text>
            <Text style={styles.docNumero}>N° {numero}</Text>
            <Text style={styles.docFecha}>Fecha: {formatDate(orden.fecha_produccion)}</Text>
            <Text style={styles.estadoBadge}>{orden.estado}</Text>
          </View>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>PRODUCTO A PRODUCIR</Text>
            <Text style={styles.infoValue}>{orden.producto}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>CANTIDAD</Text>
            <Text style={styles.infoValue}>{orden.cantidad_producida} unidades</Text>
          </View>
        </View>

        {(orden.receta_nombre || orden.supervisor) && (
          <View style={styles.infoGrid}>
            {orden.receta_nombre && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>RECETA</Text>
                <Text style={styles.infoValue}>{orden.receta_nombre}</Text>
              </View>
            )}
            {orden.supervisor && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>SUPERVISOR</Text>
                <Text style={styles.infoValue}>{orden.supervisor}</Text>
              </View>
            )}
          </View>
        )}

        {/* Consumos table */}
        <Text style={styles.sectionTitulo}>MATERIAS PRIMAS E INSUMOS NECESARIOS</Text>
        {orden.consumos.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thNombre]}>Ingrediente</Text>
              <Text style={[styles.th, styles.thTipo]}>Tipo</Text>
              <Text style={[styles.th, styles.thCant]}>Cantidad</Text>
              <Text style={[styles.th, styles.thUnidad]}>Unidad</Text>
              <Text style={[styles.th, styles.thCostoU]}>Costo Unit.</Text>
              <Text style={[styles.th, styles.thCostoT]}>Costo Total</Text>
            </View>
            {orden.consumos.map((item, i) => (
              <View key={`c-${i}`} style={[styles.tableRow, i % 2 === 1 ? styles.rowAlt : {}]}>
                <Text style={[styles.td, styles.tdNombre]}>{item.nombre}</Text>
                <Text style={[styles.td, styles.tdTipo, item.tipo === 'materia_prima' ? styles.tipoMP : styles.tipoIns]}>
                  {item.tipo === 'materia_prima' ? 'MP' : 'Insumo'}
                </Text>
                <Text style={[styles.td, styles.tdCant]}>{item.cantidad}</Text>
                <Text style={[styles.td, styles.tdUnidad]}>{item.unidad}</Text>
                <Text style={[styles.td, styles.tdCostoU]}>{formatCurrency(item.costo_unitario)}</Text>
                <Text style={[styles.td, styles.tdCostoT]}>{formatCurrency(item.costo_total)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={{ fontSize: 10, color: COLORS.grisOscuro, marginBottom: 8 }}>
            No hay consumos registrados.
          </Text>
        )}

        {/* Productos generados */}
        {orden.generados.length > 0 && (
          <>
            <Text style={styles.sectionTitulo}>PRODUCTOS GENERADOS</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thNombre]}>Producto</Text>
              <Text style={[styles.th, styles.thCant]}>Cantidad</Text>
              <Text style={[styles.th, styles.thCostoU]}>Costo Unit.</Text>
              <Text style={[styles.th, styles.thCostoT]}>Costo Total</Text>
            </View>
            {orden.generados.map((item, i) => (
              <View key={`g-${i}`} style={[styles.tableRow, i % 2 === 1 ? styles.rowAlt : {}]}>
                <Text style={[styles.td, styles.tdNombre]}>{item.nombre}</Text>
                <Text style={[styles.td, styles.tdCant]}>{item.cantidad}</Text>
                <Text style={[styles.td, styles.tdCostoU]}>{formatCurrency(item.costo_unitario)}</Text>
                <Text style={[styles.td, styles.tdCostoT]}>{formatCurrency(item.costo_total)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Costos */}
        <View style={styles.costosBox}>
          <View style={styles.costosInner}>
            <View style={styles.costosLine}><Text>Costo Materias Primas:</Text><Text>{formatCurrency(orden.costo_materias_primas)}</Text></View>
            <View style={styles.costosLine}><Text>Costo Insumos:</Text><Text>{formatCurrency(orden.costo_insumos)}</Text></View>
            <View style={styles.costosFinal}><Text>COSTO TOTAL ESTIMADO:</Text><Text>{formatCurrency(orden.costo_total)}</Text></View>
          </View>
        </View>

        {/* Observaciones */}
        {orden.observaciones && (
          <View style={styles.obsBox}>
            <Text style={styles.obsTitulo}>OBSERVACIONES</Text>
            <Text style={styles.obsTexto}>{orden.observaciones}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.firmaRow}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaLabel}>Supervisor — Firma y Aclaracion</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaLabel}>Responsable de Produccion — Firma y Aclaracion</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Orden de Produccion {numero} — {EMPRESA.nombre} — Generado el {new Date().toLocaleDateString('es-AR')}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default OrdenProduccionPDFDocument
