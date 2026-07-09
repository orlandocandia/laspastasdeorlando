'use client'

import {
  Document, Page, Text, View, StyleSheet, Image as PDFImage,
} from '@react-pdf/renderer'
import {
  FICHA_COLORS as COLORS,
  FICHA_EMPRESA as EMPRESA,
  formatCurrency, formatNumber, formatFechaHora,
} from './ficha-shared'

// ============================================
// TIPOS
// ============================================
export interface FichaMateriaPrimaData {
  id: number
  codigo: string | null
  nombre: string
  descripcion: string | null
  id_categoria: number
  id_unidad_base: number
  stock_actual: number
  stock_minimo: number
  precio_compra_referencia: number
  imagen: string | null
  estado: boolean
  categoria: { id: number; nombre: string } | null
  unidadBase: { id: number; codigo: string; nombre: string } | null
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docSubtitulo: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 4 },
  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  imagenBox: { width: 140, height: 140, backgroundColor: COLORS.grisClaro, borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  imagenPlaceholder: { fontSize: 9, color: COLORS.grisOscuro, fontStyle: 'italic' },
  imagen: { width: 138, height: 138, objectFit: 'cover' as const, borderRadius: 4 },
  infoCol: { flex: 1, gap: 8 },
  infoRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { width: '40%', fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.grisOscuro, textTransform: 'uppercase' },
  infoValue: { flex: 1, fontSize: 10, color: COLORS.negro, fontFamily: 'Helvetica-Bold' },
  stockBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stockCard: { flex: 1, backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, borderLeftWidth: 3, borderLeftColor: COLORS.mostaza },
  stockCritico: { borderLeftColor: COLORS.rojo },
  stockLabel: { fontSize: 8, color: COLORS.grisOscuro, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  stockValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 3 },
  stockValueCritico: { color: COLORS.rojo },
  seccionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 10, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.mostaza, paddingBottom: 4 },
  descBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, fontSize: 10, color: COLORS.negro },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function FichaMateriaPrimaDocument({ data: materiaPrima }: { data: FichaMateriaPrimaData }) {
  const fechaGen = formatFechaHora(new Date())
  const stockCritico = materiaPrima.stock_actual <= materiaPrima.stock_minimo
  const unidad = materiaPrima.unidadBase?.codigo || 'u.'
  const tieneImagen = Boolean(materiaPrima.imagen)
  const valorStock = materiaPrima.stock_actual * materiaPrima.precio_compra_referencia

  return (
    <Document title={`Ficha de Materia Prima — ${materiaPrima.nombre}`} author={EMPRESA.nombre} subject="Ficha de Materia Prima">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>FICHA DE MATERIA PRIMA</Text>
            <Text style={styles.docSubtitulo}>{materiaPrima.codigo ? `Cód: ${materiaPrima.codigo}` : `ID: ${materiaPrima.id}`}</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {/* Imagen */}
          <View style={styles.imagenBox}>
            {tieneImagen ? (
              <PDFImage style={styles.imagen} src={materiaPrima.imagen as string} />
            ) : (
              <Text style={styles.imagenPlaceholder}>Sin imagen</Text>
            )}
          </View>

          {/* Datos básicos */}
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{materiaPrima.nombre}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código</Text>
              <Text style={styles.infoValue}>{materiaPrima.codigo || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoría</Text>
              <Text style={styles.infoValue}>{materiaPrima.categoria?.nombre || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Unidad de Medida</Text>
              <Text style={styles.infoValue}>{materiaPrima.unidadBase?.nombre || '-'} ({materiaPrima.unidadBase?.codigo || '-'})</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>{materiaPrima.estado ? 'Activo' : 'Inactivo'}</Text>
            </View>
          </View>
        </View>

        {/* Stock y precio */}
        <View style={styles.stockBox}>
          <View style={[styles.stockCard, stockCritico ? styles.stockCritico : {}]}>
            <Text style={styles.stockLabel}>Stock Actual</Text>
            <Text style={[styles.stockValue, stockCritico ? styles.stockValueCritico : {}]}>{formatNumber(materiaPrima.stock_actual)} {unidad}</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Stock Mínimo</Text>
            <Text style={styles.stockValue}>{formatNumber(materiaPrima.stock_minimo)} {unidad}</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Precio Ref.</Text>
            <Text style={styles.stockValue}>{formatCurrency(materiaPrima.precio_compra_referencia)}</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Valor Stock</Text>
            <Text style={styles.stockValue}>{formatCurrency(valorStock)}</Text>
          </View>
        </View>

        {stockCritico && (
          <View style={[styles.stockCard, { borderLeftColor: COLORS.rojo, marginBottom: 12 }]}>
            <Text style={{ fontSize: 10, color: COLORS.rojo, fontFamily: 'Helvetica-Bold' }}>⚠ ALERTA: Stock por debajo del mínimo recomendado</Text>
          </View>
        )}

        {/* Descripción */}
        {materiaPrima.descripcion && (
          <>
            <Text style={styles.seccionTitle}>Descripción</Text>
            <View style={styles.descBox}>
              <Text>{materiaPrima.descripcion}</Text>
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>Ficha de Materia Prima — {materiaPrima.nombre} — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default FichaMateriaPrimaDocument
