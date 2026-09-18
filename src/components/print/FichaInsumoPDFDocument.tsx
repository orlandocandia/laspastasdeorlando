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
export interface FichaInsumoData {
  id: number
  codigo: string | null
  nombre: string
  descripcion: string | null
  id_tipo_insumo: number
  id_unidad_base: number
  stock_actual: number
  stock_minimo: number
  precio_compra_referencia: number
  imagen: string | null
  estado: boolean
  tipoInsumo: { id: number; nombre: string } | null
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
  imagenBox: { width: 130, height: 130, backgroundColor: COLORS.grisClaro, borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  imagenPlaceholder: { fontSize: 9, color: COLORS.grisOscuro, fontStyle: 'italic' },
  imagen: { width: 128, height: 128, objectFit: 'cover' as const, borderRadius: 4 },
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
  badge: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, backgroundColor: COLORS.oliva, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3 },
  badgeRojo: { backgroundColor: COLORS.rojo, color: COLORS.blanco },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function FichaInsumoDocument({ data: insumo }: { data: FichaInsumoData }) {
  const fechaGen = formatFechaHora(new Date())
  const tieneImagen = Boolean(insumo.imagen)
  const stockCritico = insumo.stock_actual <= insumo.stock_minimo
  const unidad = insumo.unidadBase?.codigo || insumo.unidadBase?.nombre || 'u.'

  return (
    <Document title={`Ficha de Insumo — ${insumo.nombre}`} author={EMPRESA.nombre} subject="Ficha de Insumo">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>FICHA DE INSUMO</Text>
            <Text style={styles.docSubtitulo}>{insumo.codigo ? `Cod: ${insumo.codigo}` : `ID: ${insumo.id}`}</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        {/* Datos basicos con imagen */}
        <View style={styles.infoGrid}>
          <View style={styles.imagenBox}>
            {tieneImagen ? (
              <PDFImage style={styles.imagen} src={insumo.imagen as string} />
            ) : (
              <Text style={styles.imagenPlaceholder}>Sin imagen</Text>
            )}
          </View>

          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{insumo.nombre}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Codigo</Text>
              <Text style={styles.infoValue}>{insumo.codigo || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo de Insumo</Text>
              <Text style={styles.infoValue}>{insumo.tipoInsumo?.nombre || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Unidad Base</Text>
              <Text style={styles.infoValue}>{insumo.unidadBase ? `${insumo.unidadBase.nombre} (${insumo.unidadBase.codigo})` : '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>{insumo.estado ? 'Activo' : 'Inactivo'}</Text>
            </View>
          </View>
        </View>

        {/* Stock y precio */}
        <View style={styles.stockBox}>
          <View style={[styles.stockCard, stockCritico ? styles.stockCritico : {}]}>
            <Text style={styles.stockLabel}>Stock Actual</Text>
            <Text style={[styles.stockValue, stockCritico ? styles.stockValueCritico : {}]}>{formatNumber(insumo.stock_actual)} {unidad}</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Stock Minimo</Text>
            <Text style={styles.stockValue}>{formatNumber(insumo.stock_minimo)} {unidad}</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Precio Ref.</Text>
            <Text style={styles.stockValue}>{formatCurrency(insumo.precio_compra_referencia)}</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Valor Stock</Text>
            <Text style={styles.stockValue}>{formatCurrency(insumo.stock_actual * insumo.precio_compra_referencia)}</Text>
          </View>
        </View>

        {/* Estado de stock */}
        <Text style={styles.seccionTitle}>Estado de Inventario</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nivel de Stock</Text>
              <Text style={styles.infoValue}>
                {stockCritico ? 'CRITICO (debajo del minimo)' : 'OK (sobre el minimo)'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Disponible</Text>
              <Text style={styles.infoValue}>{formatNumber(Math.max(0, insumo.stock_actual - insumo.stock_minimo))} {unidad}</Text>
            </View>
          </View>
        </View>

        {/* Descripcion */}
        {insumo.descripcion ? (
          <>
            <Text style={styles.seccionTitle}>Descripcion</Text>
            <View style={styles.descBox}>
              <Text>{insumo.descripcion}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Ficha de Insumo — {insumo.nombre} — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default FichaInsumoDocument
